import { FC, useEffect, useState } from "react";

export interface PdfViewerProps {
  pdfData: any;
}

const PdfViewer: FC<PdfViewerProps> = (props) => {
  const { pdfData } = props;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const pdfBlob = new Blob([pdfData], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(pdfUrl);
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfData]);

  return (
    <div style={{ height: "1410px" }}>
      {pdfUrl ? (
        <iframe src={pdfUrl} width="100%" height="1410px" title="PDF Viewer" />
      ) : (
        <p>Loading PDF...</p>
      )}
    </div>
  );
};

export default PdfViewer;
