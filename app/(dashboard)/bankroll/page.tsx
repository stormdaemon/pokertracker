import { getBankrollData } from "@/features/bankroll/actions";
import { BankrollDashboard } from "@/features/bankroll/bankroll-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export const metadata = { title: "Bankroll - Poker Tracker Pro" };

export default async function BankrollPage() {
  const data = await getBankrollData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Bankroll</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Impossible de charger les données.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bankroll</h2>
      <BankrollDashboard
        balance={data.balance}
        currency={data.currency}
        monthProfit={data.monthProfit}
        weekProfit={data.weekProfit}
        allTimeHigh={data.allTimeHigh}
        allTimeLow={data.allTimeLow}
        transactions={data.transactions}
      />
    </div>
  );
}
