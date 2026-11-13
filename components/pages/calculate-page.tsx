"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { CalculationDetailDrawer } from "@/components/calculation-detail-drawer";
import {
  CalculatorForm,
  type CalculatorFormValues,
} from "@/components/calculator-form";
import { ScreenLoader } from "@/components/screen-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { postCalcular } from "@/lib/api-client";
import { formatCurrencyInputFromNumber } from "@/lib/format";
import {
  loadCalculatorPrefs,
  prefsToFormDefaults,
  saveCalculatorPrefs,
} from "@/lib/calculator-prefs";
import type { CalcularCustoInput, Viagem } from "@/types/viagem";

function formatPrefNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function CalculatePage() {
  const [result, setResult] = React.useState<Viagem | null>(null);
  const [resultOpen, setResultOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [prefsDefaults, setPrefsDefaults] = React.useState<
    Partial<CalculatorFormValues> | null
  >(null);

  React.useEffect(() => {
    const prefs = loadCalculatorPrefs();
    setPrefsDefaults(prefs ? prefsToFormDefaults(prefs) : {});
  }, []);

  async function handleSubmit(data: CalcularCustoInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const viagem = await postCalcular(data);
      setResult(viagem);
      setResultOpen(true);

      saveCalculatorPrefs({
        tipoCombustivel: viagem.tipoCombustivel ?? "gasolina-comum",
        precoCombustivel: formatCurrencyInputFromNumber(viagem.precoCombustivel),
        consumoCarro: formatPrefNumber(viagem.consumoCarro),
        quantidadePassageiros: String(viagem.quantidadePassageiros),
      });
    } catch (err) {
      setResult(null);
      setResultOpen(false);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível calcular o custo da viagem."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-[34px]">
          Calcular custo
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Informe os dados da viagem para estimar combustível, custo total e
          rateio por passageiros.
        </p>
      </header>

      {prefsDefaults !== null ? (
        <CalculatorForm
          key={JSON.stringify(prefsDefaults)}
          defaultValues={prefsDefaults}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ScreenLoader label="Carregando formulário..." />
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Falha no cálculo</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <CalculationDetailDrawer
        viagem={result}
        open={resultOpen && result !== null}
        onOpenChange={setResultOpen}
        title="Resultado do cálculo"
        description="Custo estimado com base nos dados informados."
      />
    </div>
  );
}
