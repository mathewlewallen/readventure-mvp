import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExportFormat } from './types/export-format.enum';
import * as PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async exportUserProgress(userId: number, format: ExportFormat) {
    const progress = await this.prisma.storyProgress.findMany({
      where: { userId },
      include: {
        story: true,
      },
    });

    const exportData = progress.map((p) => ({
      storyTitle: p.story.title,
      currentPage: p.currentPage,
      totalPages: p.story.content.split('\n').length,
      completed: p.isCompleted,
      startedAt: p.createdAt,
      lastReadAt: p.updatedAt,
    }));

    switch (format) {
      case ExportFormat.CSV:
        return this.generateCSV(exportData);
      case ExportFormat.PDF:
        return this.generatePDF(exportData);
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  private generateCSV(data: any[]) {
    const parser = new Parser();
    return parser.parse(data);
  }

  private generatePDF(data: any[]) {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Reading Progress Report', { align: 'center' });
      doc.moveDown();

      data.forEach((item) => {
        doc.fontSize(12).text(`Story: ${item.storyTitle}`);
        doc
          .fontSize(10)
          .text(`Progress: ${item.currentPage}/${item.totalPages} pages`);
        doc
          .fontSize(10)
          .text(`Status: ${item.completed ? 'Completed' : 'In Progress'}`);
        doc.fontSize(10).text(`Started: ${item.startedAt}`);
        doc.fontSize(10).text(`Last Read: ${item.lastReadAt}`);
        doc.moveDown();
      });

      doc.end();
    });
  }
}
