const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');
const { check, validationResult } = require('express-validator');

class DataImportExport {
    static async importCSV(filePath, schema) {
        const results = [];

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    results.push(row);
                })
                .on('end', () => {
                    const errors = this.validateData(results, schema);
                    if (errors.length) {
                        reject({ message: 'Validation errors', errors });
                    } else {
                        resolve(results);
                    }
                })
                .on('error', (error) => reject(error));
        });
    }

    static exportCSV(data, filePath) {
        const csvWriter = createCsvWriter({
            path: filePath,
            header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
        });

        return csvWriter.writeRecords(data);
    }

    static importExcel(filePath, schema) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const errors = this.validateData(data, schema);
        if (errors.length) {
            throw { message: 'Validation errors', errors };
        }

        return data;
    }

    static exportExcel(data, filePath) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, filePath);
    }

    static importJSON(filePath, schema) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const errors = this.validateData(data, schema);
        if (errors.length) {
            throw { message: 'Validation errors', errors };
        }

        return data;
    }

    static exportJSON(data, filePath) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    static validateData(data, schema) {
        return data.flatMap((item) => {
            return schema.map((validation) => {
                const result = validation.run({ body: item });
                return validationResult(result).array();
            });
        }).filter((error) => error.length);
    }
}

module.exports = DataImportExport;
