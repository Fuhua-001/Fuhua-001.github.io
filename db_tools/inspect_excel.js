const xlsx = require('xlsx');

try {
    const workbook = xlsx.readFile('C:\\Users\\yatta\\Downloads\\table_data.xlsx');
    console.log("Sheets:", workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(data);
    });
} catch (e) {
    console.error(e);
}
