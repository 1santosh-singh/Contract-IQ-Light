declare module 'pdf-parse' {
  export default function pdfParse(buffer: Buffer): Promise<{
    text: string;
    info: any;
    metadata: any;
    version: string;
    numpages: number;
  }>;
}