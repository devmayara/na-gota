"use client";

import { CalculationResultCard } from "@/components/calculation-result-card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import type { Viagem } from "@/types/viagem";

export type CalculationDetailDrawerProps = {
  viagem: Viagem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function CalculationDetailDrawer({
  viagem,
  open,
  onOpenChange,
  title = "Detalhes do cálculo",
  description,
}: CalculationDetailDrawerProps) {
  const resolvedDescription =
    description ??
    (viagem
      ? `Registrado em ${formatDateTime(viagem.createdAt)}`
      : "Resumo completo da viagem selecionada.");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="flex max-h-[92vh] flex-col md:mx-auto md:max-w-lg md:rounded-t-xl">
        <DrawerHeader className="border-b border-border text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{resolvedDescription}</DrawerDescription>
        </DrawerHeader>

        {viagem ? (
          <div className="flex-1 overflow-y-auto p-4">
            <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                <dt className="text-xs text-muted-foreground">
                  Preço combustível
                </dt>
                <dd className="font-mono font-medium">
                  {formatCurrency(viagem.precoCombustivel)}/L
                </dd>
              </div>
              <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                <dt className="text-xs text-muted-foreground">Consumo</dt>
                <dd className="font-mono font-medium">
                  {formatNumber(viagem.consumoCarro)} Km/L
                </dd>
              </div>
            </dl>

            <CalculationResultCard
              result={viagem}
              origem={viagem.origem}
              destino={viagem.destino}
              distanciaKm={viagem.distanciaKm}
              quantidadePassageiros={viagem.quantidadePassageiros}
              tipoCombustivel={viagem.tipoCombustivel}
              tipoTrajeto={viagem.tipoTrajeto}
              hideStatusBadge
            />
          </div>
        ) : null}

        <DrawerFooter className="border-t border-border">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="min-h-12 w-full">
              Fechar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
