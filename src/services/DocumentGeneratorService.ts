import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export interface DocumentMetadata {
  type: 'OFÍCIO' | 'RELATÓRIO' | 'CERTIDÃO' | 'OUTRO';
  number?: string;
  year: number;
  subject: string;
  recipient?: string;
  date: string;
  author: string;
  institution: string;
}

export class DocumentGeneratorService {
  static async generateInstitutionalPDF(
    title: string,
    content: string,
    metadata: DocumentMetadata,
    chartsToInclude?: HTMLElement[]
  ): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Cabeçalho Institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(metadata.institution.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Informação e Monitoramento do Conselho Tutelar - SIMCT', pageWidth / 2, 26, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    // Metadata
    doc.setFont('helvetica', 'bold');
    doc.text(`${metadata.type} Nº ${metadata.number || '____'}/${metadata.year}`, margin, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${metadata.date}`, pageWidth - margin, 40, { align: 'right' });

    if (metadata.recipient) {
      doc.text(`Ao: ${metadata.recipient}`, margin, 50);
    }
    doc.text(`Assunto: ${metadata.subject}`, margin, 58);

    // Conteúdo
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(content, pageWidth - (2 * margin));
    doc.text(splitText, margin, 75);

    let currentY = 75 + (splitText.length * 5);

    // Incluir Gráficos se existirem
    if (chartsToInclude && chartsToInclude.length > 0) {
      for (const chart of chartsToInclude) {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }
        
        try {
          const canvas = await html2canvas(chart, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (2 * margin);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        } catch (e) {
          console.error("Failed to add chart to PDF:", e);
        }
      }
    }

    // Assinatura
    if (currentY > 250) {
      doc.addPage();
      currentY = 40;
    } else {
      currentY += 20;
    }

    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(metadata.author, pageWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Conselheiro(a) Tutelar em Exercício', pageWidth / 2, currentY + 10, { align: 'center' });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
      doc.text('Hortolândia - SP | Gerado pelo JARVIS - SIMCT', pageWidth / 2, 290, { align: 'center' });
    }

    doc.save(`${metadata.type}_${metadata.number || 'DOC'}_${metadata.year}.pdf`);
  }
}
