import * as XLSX from 'xlsx';

export interface Operation {
  date: Date;
  label: string;
  amount: number;
  category: string;
  originalId: string; // To prevent duplicates
}

export const parseOperationsExcel = async (file: File): Promise<Operation[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        // Find header row index (looking for "Date", "Libellé", etc.)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const row = rawData[i];
          if (row && row.some((cell: any) => cell && cell.toString().includes('Date') && row.some((c: any) => c && c.toString().includes('Libellé')))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          reject(new Error("Format de fichier non reconnu. Impossible de trouver la ligne d'en-tête (Date, Libellé...)."));
          return;
        }

        const operations: Operation[] = [];
        
        // Iterate starting from the row AFTER the header
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 2) continue; // Skip empty rows

          // Column mapping based on observed structure: 
          // 0: Date, 1: Libellé, 2: Débit, 3: Crédit (may vary slightly, relying on index for now as per analysis)
          // Analysis showed: 0=Date, 1=Libellé, 2=Débit, 3=Crédit
          
          const rawDate = row[0];
          const label = row[1];
          const debitRaw = row[2];
          const creditRaw = row[3];

          if (!rawDate && !label) continue;

          // Parse Amount
          let amount = 0;
          if (typeof creditRaw === 'number') {
            amount += creditRaw;
          } else if (creditRaw && !isNaN(parseFloat(creditRaw))) {
             amount += parseFloat(creditRaw);
          }

          if (typeof debitRaw === 'number') {
            amount -= debitRaw;
          } else if (debitRaw && !isNaN(parseFloat(debitRaw))) {
            amount -= parseFloat(debitRaw);
          }
          
          // Parse Date (Excel dates are sometimes serial numbers)
          let dateObj = new Date();
          if (typeof rawDate === 'number') {
             // Excel serial date conversion
             dateObj = new Date(Math.round((rawDate - 25569)*86400*1000));
          } else if (rawDate instanceof Date) {
             dateObj = rawDate;
          } else {
             // Try string parsing
             dateObj = new Date(rawDate);
          }

          if (isNaN(dateObj.getTime())) continue; // Skip invalid dates

          // Create unique ID concept (simple hash of date+label+amount)
          // Fix: Handle unicode characters and replace '/' which is invalid in Firestore doc IDs
          const uniqueString = `${dateObj.toISOString()}-${label}-${amount}`;
          // Simple hash function for unicode strings to avoid btoa issues
          let hash = 0;
          for (let k = 0; k < uniqueString.length; k++) {
            const char = uniqueString.charCodeAt(k);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
          }
          const originalId = `op_${Math.abs(hash)}_${i}`; // Append index to ensure uniqueness if hash collides

          // Categorization logic (Basic)
          let category = "Autre";
          const lowerLabel = label?.toString().toLowerCase() || "";
          
          if (lowerLabel.includes("uber") || lowerLabel.includes("bolt") || lowerLabel.includes("sncf")) category = "Transport";
          else if (lowerLabel.includes("carrefour") || lowerLabel.includes("monoprix") || lowerLabel.includes("leclerc")) category = "Alimentation";
          else if (lowerLabel.includes("restaurant") || lowerLabel.includes("mcdo") || lowerLabel.includes("kfc")) category = "Restaurant";
          else if (lowerLabel.includes("loyer")) category = "Logement";
          else if (lowerLabel.includes("edf") || lowerLabel.includes("engie")) category = "Factures";
          else if (amount > 0) category = "Revenu";

          operations.push({
            date: dateObj,
            label: label?.toString().trim() || "Sans libellé",
            amount,
            category,
            originalId
          });
        }

        resolve(operations);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
