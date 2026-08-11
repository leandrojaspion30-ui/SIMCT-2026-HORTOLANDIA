import { Documento, AgendaEntry, User } from './types';

export interface SIMCTStats {
  totalProntuarios: number;
  bairrosMaisAfetados: { [key: string]: number };
  violacoesPredominantes: { [key: string]: number };
  statusProcedimentos: { [key: string]: number };
  encaminhamentosFrequentes: { [key: string]: number };
  faixaEtaria: { [key: string]: number };
  reincidencias: number;
  periodoAnalise: {
    inicio: string;
    fim: string;
  };
}

export class SIMCTDataService {
  static getGeneralStats(documents: Documento[]): SIMCTStats {
    const stats: SIMCTStats = {
      totalProntuarios: documents.length,
      bairrosMaisAfetados: {},
      violacoesPredominantes: {},
      statusProcedimentos: {},
      encaminhamentosFrequentes: {},
      faixaEtaria: {},
      reincidencias: 0,
      periodoAnalise: {
        inicio: new Date().toLocaleDateString(),
        fim: new Date().toLocaleDateString(),
      }
    };

    const reincidenciaMap = new Map<string, number>();

    documents.forEach(doc => {
      // Bairros
      const bairro = (doc.bairro || 'NÃO INFORMADO').toUpperCase();
      stats.bairrosMaisAfetados[bairro] = (stats.bairrosMaisAfetados[bairro] || 0) + 1;

      // Status
      const status = Array.isArray(doc.status) && doc.status.length > 0 ? doc.status[0] : 'AGUARDANDO_ANALISE';
      stats.statusProcedimentos[status] = (stats.statusProcedimentos[status] || 0) + 1;

      // Violações (usando origem como proxy ou campos específicos se existirem)
      const violacao = (doc.origem || 'OUTROS').toUpperCase();
      stats.violacoesPredominantes[violacao] = (stats.violacoesPredominantes[violacao] || 0) + 1;

      // Reincidência (por nome da genitora/criança simplificado)
      const key = `${doc.nome_genitora}-${doc.nome_crianca}`.toLowerCase();
      reincidenciaMap.set(key, (reincidenciaMap.get(key) || 0) + 1);
    });

    stats.reincidencias = Array.from(reincidenciaMap.values()).filter(v => v > 1).length;

    return stats;
  }

  static comparePeriods(docsCurrent: Documento[], docsPast: Documento[]): any {
    const statsCurrent = this.getGeneralStats(docsCurrent);
    const statsPast = this.getGeneralStats(docsPast);

    const variation = ((statsCurrent.totalProntuarios - statsPast.totalProntuarios) / (statsPast.totalProntuarios || 1)) * 100;

    return {
      current: statsCurrent,
      past: statsPast,
      variationPercent: variation.toFixed(2),
      isIncrease: variation > 0
    };
  }
}
