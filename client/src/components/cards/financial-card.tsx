import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface FinancialCardProps {
  title: string;
  amount: string;
  icon: ReactNode;
  color: "primary" | "success" | "warning" | "error" | "accent";
}

export default function FinancialCard({ title, amount, icon, color }: FinancialCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {amount}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
