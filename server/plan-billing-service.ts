import { storage } from "./storage";

export class PlanBillingService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('💳 Serviço de cobrança de planos iniciado');
    
    // Run immediately on startup
    this.generateMonthlyBilling();
    
    // Run every day at midnight to check for monthly billing
    this.intervalId = setInterval(() => {
      this.generateMonthlyBilling();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('💳 Serviço de cobrança de planos parado');
  }

  private async generateMonthlyBilling() {
    try {
      console.log('💳 Verificando necessidade de gerar cobranças mensais...');
      
      // Only generate on the 1st of each month
      const today = new Date();
      if (today.getDate() === 1) {
        console.log('💳 Gerando cobranças mensais para todos os planos ativos...');
        await storage.generateMonthlyPlanReceivables();
        console.log('💳 Cobranças mensais geradas com sucesso');
      }
    } catch (error) {
      console.error('💳 Erro ao gerar cobranças mensais:', error);
    }
  }

  // Manual trigger for testing
  async triggerMonthlyBilling() {
    console.log('💳 Trigger manual de cobrança mensal iniciado...');
    await storage.generateMonthlyPlanReceivables();
    console.log('💳 Trigger manual de cobrança mensal concluído');
  }
}

export const planBillingService = new PlanBillingService();