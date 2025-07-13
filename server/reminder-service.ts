import { storage } from "./storage";
import { sendTextMessage } from "./whatsapp";
import { PaymentReminder, Receivable, Client } from "@shared/schema";
import { format, addDays, subDays, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export class ReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Inicia o serviço de lembretes (executa a cada hora)
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🔔 Serviço de lembretes iniciado");
    
    // Executa imediatamente
    this.processReminders();
    
    // Executa a cada hora
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, 60 * 60 * 1000); // 1 hora
  }

  // Para o serviço de lembretes
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🔔 Serviço de lembretes parado");
  }

  // Processa todos os lembretes ativos
  private async processReminders() {
    try {
      console.log("🔔 Processando lembretes...");
      
      // Busca todos os usuários com lembretes ativos
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        await this.processUserReminders(user.id);
      }
      
      console.log("🔔 Processamento de lembretes concluído");
    } catch (error) {
      console.error("❌ Erro ao processar lembretes:", error);
    }
  }

  // Processa lembretes de um usuário específico
  async processUserReminders(userId: number) {
    try {
      // Busca lembretes ativos do usuário
      const activeReminders = await storage.getActivePaymentReminders(userId);
      
      if (activeReminders.length === 0) {
        return;
      }

      // Busca todas as contas a receber pendentes do usuário
      const receivables = await storage.getReceivables(userId);
      const pendingReceivables = receivables.filter(r => r.status === "pending");

      for (const reminder of activeReminders) {
        await this.processReminder(reminder, pendingReceivables, userId);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar lembretes do usuário ${userId}:`, error);
    }
  }

  // Processa um lembrete específico
  private async processReminder(
    reminder: PaymentReminder,
    receivables: (Receivable & { client: Client })[],
    userId: number
  ) {
    const currentTime = new Date();
    const currentHour = format(currentTime, "HH:mm");
    
    // Verifica se é o horário correto para processar este lembrete
    if (currentHour !== reminder.triggerTime) {
      return;
    }

    for (const receivable of receivables) {
      if (await this.shouldSendReminder(reminder, receivable)) {
        await this.sendReminder(reminder, receivable, userId);
      }
    }
  }

  // Verifica se deve enviar um lembrete para uma conta específica
  private async shouldSendReminder(reminder: PaymentReminder, receivable: Receivable): Promise<boolean> {
    const today = new Date();
    const dueDate = new Date(receivable.dueDate);
    const triggerDays = reminder.triggerDays || 0;

    let shouldSend = false;

    switch (reminder.triggerType) {
      case "before_due":
        const beforeDate = subDays(dueDate, triggerDays);
        shouldSend = isToday(beforeDate);
        break;
      
      case "on_due":
        shouldSend = isToday(dueDate);
        break;
      
      case "after_due":
        const afterDate = addDays(dueDate, triggerDays);
        shouldSend = isToday(afterDate);
        break;
    }

    if (!shouldSend) {
      return false;
    }

    // Verifica se já foi enviado um lembrete hoje para esta conta
    const logs = await storage.getReminderLogs(receivable.userId);
    const todayLogs = logs.filter(log => 
      log.reminderId === reminder.id && 
      log.receivableId === receivable.id &&
      log.createdAt && isToday(new Date(log.createdAt))
    );

    return todayLogs.length === 0;
  }

  // Envia um lembrete
  private async sendReminder(
    reminder: PaymentReminder,
    receivable: Receivable & { client: Client },
    userId: number
  ) {
    try {
      // Substitui as variáveis na mensagem
      const message = this.replaceVariables(reminder.messageTemplate, receivable);
      
      // Tenta enviar a mensagem via WhatsApp
      let status = "sent";
      let errorMessage = null;
      let sentAt = new Date();

      try {
        const whatsappResult = await sendTextMessage(
          receivable.client.whatsapp,
          message,
          "payment_reminder",
          userId
        );
        
        if (!whatsappResult.success) {
          status = "failed";
          errorMessage = whatsappResult.error || "Erro ao enviar mensagem";
        }
      } catch (error) {
        status = "failed";
        errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("❌ Erro ao enviar lembrete via WhatsApp:", error);
      }

      // Registra o log do lembrete
      await storage.createReminderLog({
        reminderId: reminder.id,
        receivableId: receivable.id,
        clientId: receivable.client.id,
        messageContent: message,
        status,
        errorMessage,
        sentAt: status === "sent" ? sentAt : null,
      });

      if (status === "sent") {
        console.log(`✅ Lembrete enviado para ${receivable.client.name}: ${receivable.description}`);
      } else {
        console.log(`❌ Falha ao enviar lembrete para ${receivable.client.name}: ${errorMessage}`);
      }
    } catch (error) {
      console.error("❌ Erro ao processar envio de lembrete:", error);
    }
  }

  // Substitui variáveis na mensagem do lembrete
  private replaceVariables(template: string, receivable: Receivable & { client: Client }): string {
    const dueDate = format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR });
    const today = new Date();
    const dueDateObj = new Date(receivable.dueDate);
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));

    return template
      .replace(/{cliente}/g, receivable.client.name)
      .replace(/{valor}/g, `R$ ${receivable.amount.toFixed(2).replace(".", ",")}`)
      .replace(/{vencimento}/g, dueDate)
      .replace(/{descricao}/g, receivable.description)
      .replace(/{dias_atraso}/g, daysOverdue.toString());
  }
}

// Instância singleton do serviço
export const reminderService = new ReminderService();