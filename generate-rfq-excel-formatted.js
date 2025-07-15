const ExcelJS = require('exceljs');

async function createFormattedRFQEvaluationMatrix() {
    const workbook = new ExcelJS.Workbook();
    
    // Define vendor placeholders (up to 10)
    const vendorPlaceholders = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E', 'Vendor F', 'Vendor G', 'Vendor H', 'Vendor I', 'Vendor J'];
    const activeVendors = 7; // Default to 7 active vendors, can be adjusted
    
    // Common styles
    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    };
    
    const dataStyle = {
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    };
    
    const vendorStyle = {
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    };
    
    // Helper function to style headers
    function styleHeaders(worksheet, headerRow) {
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        headerRow.height = 40;
    }
    
    // Helper function to style data rows
    function styleDataRows(worksheet, startRow, endRow) {
        for (let i = startRow; i <= endRow; i++) {
            const row = worksheet.getRow(i);
            row.height = 25;
            row.eachCell((cell, colNumber) => {
                if (colNumber === 1) {
                    cell.style = vendorStyle;
                } else {
                    cell.style = dataStyle;
                    // Alternate row colors
                    if (i % 2 === 0) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
                    }
                }
            });
        }
    }
    
    // Sheet 1: Vendor Mapping (Configuration)
    const vendorMapping = workbook.addWorksheet('Vendor Mapping');
    vendorMapping.tabColor = { argb: 'FFD700' }; // Gold tab
    
    // Create vendor mapping table
    const mappingHeaders = ['Vendor ID', 'Vendor Name', 'Status'];
    const mappingHeaderRow = vendorMapping.addRow(mappingHeaders);
    styleHeaders(vendorMapping, mappingHeaderRow);
    
    // Add vendor mapping rows
    for (let i = 0; i < 10; i++) {
        const vendorId = String.fromCharCode(65 + i); // A, B, C, D, E, F, G, H, I, J
        const defaultName = i < activeVendors ? vendorPlaceholders[i] : '';
        const status = i < activeVendors ? 'Active' : 'Inactive';
        vendorMapping.addRow([`Vendor ${vendorId}`, defaultName, status]);
    }
    
    // Style the vendor mapping rows
    styleDataRows(vendorMapping, 2, 11);
    
    // Set column widths for vendor mapping
    vendorMapping.columns = [
        { width: 12 },
        { width: 25 },
        { width: 12 }
    ];
    
    // Add data validation for status
    const statusOptions = ['Active', 'Inactive'];
    for (let i = 2; i <= 11; i++) {
        const statusCell = vendorMapping.getCell(i, 3);
        statusCell.dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: ['"' + statusOptions.join(',') + '"']
        };
    }
    
    // Add instructions
    const instructionsRow = vendorMapping.addRow([]);
    instructionsRow.height = 20;
    
    const instructionHeaderRow = vendorMapping.addRow(['Instructions:']);
    instructionHeaderRow.getCell(1).style = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9EAD3' } }
    };
    
    const instructions = [
        ['1. Enter real vendor names in the "Vendor Name" column'],
        ['2. Set status to "Active" for vendors participating in the RFQ'],
        ['3. Set status to "Inactive" for unused vendor slots'],
        ['4. Vendor names will automatically appear throughout all evaluation sheets'],
        ['5. Only "Active" vendors will be included in evaluations'],
        ['6. You can activate up to 10 vendors total']
    ];
    
    instructions.forEach(instruction => {
        const row = vendorMapping.addRow(instruction);
        row.getCell(1).style = { alignment: { wrapText: true } };
        row.height = 20;
    });
    
    // Add Configuration Section
    const configSeparator = vendorMapping.addRow([]);
    configSeparator.height = 30;
    
    const configHeaderRow = vendorMapping.addRow(['Evaluation Configuration:']);
    configHeaderRow.getCell(1).style = {
        font: { bold: true, size: 14 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } }
    };
    
    // Factor Weights
    const weightsHeaderRow = vendorMapping.addRow(['Factor Weights (must total 100%):']);
    weightsHeaderRow.getCell(1).style = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } }
    };
    
    const factorWeights = [
        ['Factor 1: Prior Experience Weight (%)', '50'],
        ['Factor 2.1: Technical Approach Weight (%)', '25'],
        ['Factor 2.2: Management Approach Weight (%)', '25'],
        ['Total Weight Check:', { formula: 'B22+B23+B24' }]
    ];
    
    factorWeights.forEach((weight, index) => {
        const row = vendorMapping.addRow(weight);
        if (index < 3) {
            row.getCell(2).dataValidation = {
                type: 'whole',
                operator: 'between',
                formulae: [0, 100],
                allowBlank: false
            };
        } else {
            // Total check - highlight if not 100%
            row.getCell(1).style = { font: { bold: true } };
            row.getCell(2).style = { 
                font: { bold: true },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } }
            };
        }
    });
    
    // Procurement Strategy
    const strategySeparator = vendorMapping.addRow([]);
    strategySeparator.height = 20;
    
    const strategyHeaderRow = vendorMapping.addRow(['Procurement Strategy:']);
    strategyHeaderRow.getCell(1).style = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } }
    };
    
    const strategyRow = vendorMapping.addRow(['Strategy Selection:', 'Best Value Tradeoff']);
    strategyRow.getCell(2).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"LPTA,Best Value Tradeoff,Technical Superiority"']
    };
    
    // Strategy Logic Display
    const logicRow = vendorMapping.addRow(['Strategy Logic:', { formula: 'IF(B28="LPTA","Award to lowest priced technically acceptable proposal",IF(B28="Best Value Tradeoff","Balance price and technical factors using Price/Technical ratio",IF(B28="Technical Superiority","Technical factors significantly outweigh price considerations","Select a strategy")))' }]);
    logicRow.getCell(2).style = { 
        alignment: { wrapText: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } }
    };
    logicRow.height = 40;
    
    // Scoring Scale
    const scoringSeparator = vendorMapping.addRow([]);
    scoringSeparator.height = 20;
    
    const scoringHeaderRow = vendorMapping.addRow(['Confidence Rating to Numeric Score Conversion:']);
    scoringHeaderRow.getCell(1).style = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } }
    };
    
    const scoringMappings = [
        ['High Confidence:', '90 points'],
        ['Some Confidence:', '70 points'],
        ['Low Confidence:', '40 points']
    ];
    
    scoringMappings.forEach(mapping => {
        const row = vendorMapping.addRow(mapping);
        row.getCell(1).style = { font: { bold: true } };
        row.getCell(2).style = { 
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } }
        };
    });
    
    // Sheet 2: Master Summary
    const masterSummary = workbook.addWorksheet('Master Summary');
    masterSummary.tabColor = { argb: 'FF0000' }; // Red tab
    
    const headers1 = ['Vendor', 'Factor 1: Prior Experience\n(Most Important)', 'Factor 2.1: Technical Approach\n(Important)', 'Factor 2.2: Management Approach\n(Important)', 'Factor 3: Price\n(Least Important)', 'Technical Score\n(Calculated)', 'Price/Tech Ratio\n(Calculated)', 'Rank'];
    const headerRow1 = masterSummary.addRow(headers1);
    styleHeaders(masterSummary, headerRow1);
    
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        const row = masterSummary.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            '', // Factor 1
            '', // Factor 2.1  
            '', // Factor 2.2
            '', // Price
            // Technical Score calculation
            { formula: `IF(A${i+2}="","",IF(AND(B${i+2}<>"",C${i+2}<>"",D${i+2}<>""),
                ((IF(B${i+2}="High Confidence",90,IF(B${i+2}="Some Confidence",70,IF(B${i+2}="Low Confidence",40,0)))*'Vendor Mapping'!B22/100)+
                (IF(C${i+2}="High Confidence",90,IF(C${i+2}="Some Confidence",70,IF(C${i+2}="Low Confidence",40,0)))*'Vendor Mapping'!B23/100)+
                (IF(D${i+2}="High Confidence",90,IF(D${i+2}="Some Confidence",70,IF(D${i+2}="Low Confidence",40,0)))*'Vendor Mapping'!B24/100)),""))` },
            // Price/Tech Ratio calculation
            { formula: `IF(OR(A${i+2}="",E${i+2}="",F${i+2}=""),"",IF(F${i+2}=0,"N/A",VALUE(SUBSTITUTE(SUBSTITUTE(E${i+2},"$",""),",",""))/F${i+2}))` },
            '' // Rank
        ]);
    }
    
    styleDataRows(masterSummary, 2, 11);
    
    // Set column widths
    masterSummary.columns = [
        { width: 15 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 8 }
    ];
    
    // Add data validation for confidence ratings
    const confidenceOptions = ['High Confidence', 'Some Confidence', 'Low Confidence'];
    for (let i = 2; i <= 11; i++) {
        for (let j = 2; j <= 4; j++) {
            const cell = masterSummary.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + confidenceOptions.join(',') + '"']
            };
        }
    }
    
    // Add rank dropdown (1-10 to accommodate up to 10 vendors)
    const rankOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    for (let i = 2; i <= 11; i++) {
        const cell = masterSummary.getCell(i, 8); // Updated to column 8 for rank
        cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"' + rankOptions.join(',') + '"']
        };
    }
    
    // Add confidence rating definitions
    const definitionsRow = masterSummary.addRow([]);
    definitionsRow.height = 20;
    
    const defHeaderRow = masterSummary.addRow(['Confidence Rating Definitions:']);
    defHeaderRow.getCell(1).style = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9EAD3' } }
    };
    
    const definitions = [
        ['High Confidence:', 'The Government has high confidence that the Offeror understands the requirement, proposes a sound approach, and will be successful in performing the contract.'],
        ['Some Confidence:', 'The Government has some confidence that the Offeror understands the requirement, proposes a sound approach, and will be successful in performing the contract.'],
        ['Low Confidence:', 'The Government has low confidence that the Offeror understands the requirement, proposes a sound approach, and will be successful in performing the contract.']
    ];
    
    definitions.forEach(def => {
        const row = masterSummary.addRow(def);
        row.getCell(1).style = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE5CD' } } };
        row.getCell(2).style = { alignment: { wrapText: true } };
        row.height = 30;
    });
    
    // Sheet 3: Factor 1 - Prior Experience
    const priorExperience = workbook.addWorksheet('Factor 1 - Prior Experience');
    priorExperience.tabColor = { argb: '0070C0' }; // Blue tab
    
    const headers2 = ['Vendor', 'Reference 1\nScope Match', 'Reference 1\nComplexity Match', 'Reference 1\nSize ($)', 'Reference 1\nEvaluator Notes', 'Reference 2\nScope Match', 'Reference 2\nComplexity Match', 'Reference 2\nSize ($)', 'Reference 2\nEvaluator Notes', 'Overall Prior Experience Rating'];
    const headerRow2 = priorExperience.addRow(headers2);
    styleHeaders(priorExperience, headerRow2);
    
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        priorExperience.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            '', '', '$[Value]', '[Notes]', '', '', '$[Value]', '[Notes]', ''
        ]);
    }
    
    styleDataRows(priorExperience, 2, 11);
    priorExperience.columns = Array(10).fill({ width: 15 });
    
    // Add data validation for High/Some/Low ratings
    const matchOptions = ['High', 'Some', 'Low'];
    for (let i = 2; i <= 11; i++) {
        // Reference 1 Scope and Complexity Match (columns 2, 3)
        for (let j = 2; j <= 3; j++) {
            const cell = priorExperience.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + matchOptions.join(',') + '"']
            };
        }
        // Reference 2 Scope and Complexity Match (columns 6, 7)
        for (let j = 6; j <= 7; j++) {
            const cell = priorExperience.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + matchOptions.join(',') + '"']
            };
        }
        // Overall Prior Experience Rating (column 10)
        const overallCell = priorExperience.getCell(i, 10);
        overallCell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"' + confidenceOptions.join(',') + '"']
        };
    }
    
    // Sheet 4: Factor 2.1 - Technical Approach
    const technicalApproach = workbook.addWorksheet('Factor 2.1 - Technical');
    technicalApproach.tabColor = { argb: '00B050' }; // Green tab
    
    const headers3 = ['Vendor', 'TA-01\nProject Management', 'TA-02\nO&M Support', 'TA-03\nDevelopment & Modernization', 'TA-04\nTransition In', 'TA-05\nTransition Out', 'Risk Management', 'Overall Technical Rating'];
    const headerRow3 = technicalApproach.addRow(headers3);
    styleHeaders(technicalApproach, headerRow3);
    
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        technicalApproach.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            '', '', '', '', '', '', ''
        ]);
    }
    
    styleDataRows(technicalApproach, 2, 11);
    technicalApproach.columns = Array(8).fill({ width: 18 });
    
    // Add data validation for technical approach ratings
    const technicalOptions = ['High + Notes', 'Some + Notes', 'Low + Notes'];
    for (let i = 2; i <= 11; i++) {
        // Task areas (columns 2-7)
        for (let j = 2; j <= 7; j++) {
            const cell = technicalApproach.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + technicalOptions.join(',') + '"']
            };
        }
        // Overall Technical Rating (column 8)
        const overallCell = technicalApproach.getCell(i, 8);
        overallCell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"' + confidenceOptions.join(',') + '"']
        };
    }
    
    // Sheet 4: Factor 2.2 - Management Approach
    const managementApproach = workbook.addWorksheet('Factor 2.2 - Management');
    managementApproach.tabColor = { argb: 'FFC000' }; // Orange tab
    
    const headers4 = ['Vendor', 'Project Management Plan', 'Communication Plan', 'Staffing Plan', 'Organizational Structure', 'Agile Knowledge/Examples', 'Overall Management Rating'];
    const headerRow4 = managementApproach.addRow(headers4);
    styleHeaders(managementApproach, headerRow4);
    
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        managementApproach.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            '', '', '', '', '', ''
        ]);
    }
    
    styleDataRows(managementApproach, 2, 11);
    managementApproach.columns = Array(7).fill({ width: 18 });
    
    // Add data validation for management approach ratings
    const managementOptions = ['High + Notes', 'Some + Notes', 'Low + Notes'];
    for (let i = 2; i <= 11; i++) {
        // Management areas (columns 2-6)
        for (let j = 2; j <= 6; j++) {
            const cell = managementApproach.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + managementOptions.join(',') + '"']
            };
        }
        // Overall Management Rating (column 7)
        const overallCell = managementApproach.getCell(i, 7);
        overallCell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"' + confidenceOptions.join(',') + '"']
        };
    }
    
    // Sheets 5-8: Individual Evaluator Worksheets
    const evaluators = ['Evaluator 1', 'Evaluator 2', 'Evaluator 3', 'Evaluator 4'];
    const evaluatorColors = ['C00000', '7030A0', '0070C0', '00B050']; // Red, Purple, Blue, Green
    
    evaluators.forEach((evaluator, index) => {
        const worksheet = workbook.addWorksheet(evaluator);
        worksheet.tabColor = { argb: evaluatorColors[index] };
        
        const headers = [evaluator, 'Factor 1', 'Factor 2.1', 'Factor 2.2', 'Strengths', 'Weaknesses', 'Questions/Clarifications'];
        const headerRow = worksheet.addRow(headers);
        styleHeaders(worksheet, headerRow);
        
        // Add rows for all 10 possible vendors with formulas
        for (let i = 0; i < 10; i++) {
            worksheet.addRow([
                { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
                '', '', '', '[List strengths]', '[List weaknesses]', '[List questions]'
            ]);
        }
        
        styleDataRows(worksheet, 2, 11);
        worksheet.columns = Array(7).fill({ width: 18 });
        
        // Add data validation for evaluator ratings
        for (let i = 2; i <= 11; i++) {
            // Factor ratings (columns 2-4)
            for (let j = 2; j <= 4; j++) {
                const cell = worksheet.getCell(i, j);
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"' + confidenceOptions.join(',') + '"']
                };
            }
        }
    });
    
    // Sheet 9: Consensus Building
    const consensusBuilding = workbook.addWorksheet('Consensus Building');
    consensusBuilding.tabColor = { argb: '7030A0' }; // Purple tab
    
    const headers9 = ['Vendor', 'Factor', 'Evaluator 1', 'Evaluator 2', 'Evaluator 3', 'Evaluator 4', 'Consensus Rating', 'Rationale'];
    const headerRow9 = consensusBuilding.addRow(headers9);
    styleHeaders(consensusBuilding, headerRow9);
    
    let consensusRowCount = 2;
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        consensusBuilding.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            'Prior Experience', '', '', '', '', '', '[Justification]'
        ]);
        consensusBuilding.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            'Technical Approach', '', '', '', '', '', '[Justification]'
        ]);
        consensusBuilding.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            'Management Approach', '', '', '', '', '', '[Justification]'
        ]);
        consensusRowCount += 3;
    }
    
    styleDataRows(consensusBuilding, 2, consensusRowCount - 1);
    consensusBuilding.columns = Array(8).fill({ width: 15 });
    
    // Add data validation for consensus building ratings
    for (let i = 2; i < consensusRowCount; i++) {
        // Individual evaluator ratings (columns 3-6)
        for (let j = 3; j <= 6; j++) {
            const cell = consensusBuilding.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + confidenceOptions.join(',') + '"']
            };
        }
        // Consensus rating (column 7)
        const consensusCell = consensusBuilding.getCell(i, 7);
        consensusCell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"' + confidenceOptions.join(',') + '"']
        };
    }
    
    // Sheet 10: Price Analysis & Decision Matrix
    const priceAnalysis = workbook.addWorksheet('Price Analysis');
    priceAnalysis.tabColor = { argb: '00B050' }; // Green tab
    
    const headers10 = ['Vendor', 'Total Price', 'Price Rank', 'Technical Score\n(from Master)', 'Price/Tech Ratio\n(from Master)', 'Strategy-Based\nRecommendation'];
    const headerRow10 = priceAnalysis.addRow(headers10);
    styleHeaders(priceAnalysis, headerRow10);
    
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        priceAnalysis.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            '', // Price input
            { formula: `IF(A${i+2}="","",RANK(B${i+2},B$2:B$11,1))` }, // Price rank
            { formula: `IF(A${i+2}="","",'Master Summary'!F${i+2})` }, // Technical score from Master
            { formula: `IF(A${i+2}="","",'Master Summary'!G${i+2})` }, // Price/Tech ratio from Master
            // Strategy-based recommendation
            { formula: `IF(A${i+2}="","",
                IF('Vendor Mapping'!B28="LPTA",
                    IF(D${i+2}>=70,IF(C${i+2}=1,"AWARD - Lowest Price Technically Acceptable","Consider - Price Rank " & C${i+2}),"Unacceptable - Technical Score < 70"),
                    IF('Vendor Mapping'!B28="Best Value Tradeoff",
                        IF(E${i+2}=MIN(E$2:E$11),"AWARD - Best Value (Lowest Price/Tech Ratio)","Consider - P/T Ratio: " & ROUND(E${i+2},0)),
                        IF('Vendor Mapping'!B28="Technical Superiority",
                            IF(D${i+2}=MAX(D$2:D$11),"AWARD - Highest Technical Score","Consider - Tech Score: " & ROUND(D${i+2},1)),
                            "Select Strategy in Vendor Mapping"))))` }
        ]);
    }
    
    styleDataRows(priceAnalysis, 2, 11);
    priceAnalysis.columns = Array(6).fill({ width: 18 });
    
    // Add strategy summary section
    const strategySummaryRow = priceAnalysis.addRow([]);
    strategySummaryRow.height = 20;
    
    const strategyDisplayRow = priceAnalysis.addRow(['Current Strategy:', { formula: `'Vendor Mapping'!B28` }]);
    strategyDisplayRow.getCell(1).style = { font: { bold: true } };
    strategyDisplayRow.getCell(2).style = { 
        font: { bold: true, size: 14 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } }
    };
    
    const logicDisplayRow = priceAnalysis.addRow(['Decision Logic:', { formula: `'Vendor Mapping'!B29` }]);
    logicDisplayRow.getCell(1).style = { font: { bold: true } };
    logicDisplayRow.getCell(2).style = { 
        alignment: { wrapText: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } }
    };
    logicDisplayRow.height = 40;
    
    // Add award recommendation
    const awardRow = priceAnalysis.addRow(['RECOMMENDED AWARD:', { formula: `IF(COUNTIF(F2:F11,"AWARD*")=1,INDEX(A2:A11,MATCH("AWARD*",F2:F11,0)),"Review - Multiple or No Clear Winners")` }]);
    awardRow.getCell(1).style = { 
        font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C00000' } }
    };
    awardRow.getCell(2).style = { 
        font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C00000' } }
    };
    
    // Sheet 11: Traceability Matrix
    const traceabilityMatrix = workbook.addWorksheet('Traceability Matrix');
    traceabilityMatrix.tabColor = { argb: 'FF6600' }; // Orange tab
    
    // Create dynamic headers for traceability matrix
    const traceabilityHeaders = ['PWS Requirement', 'Page Reference'];
    for (let i = 0; i < 10; i++) {
        traceabilityHeaders.push({ formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` });
    }
    const headerRow11 = traceabilityMatrix.addRow(traceabilityHeaders);
    styleHeaders(traceabilityMatrix, headerRow11);
    
    const requirements = [
        ['TA-01: Project Management', 'PWS Section 3.1', '✓ (p. 5)', '✓ (p. 7)', 'Partial (p. 3)', '✓ (p. 9)', 'Missing', '✓ (p. 4)', '✓ (p. 6)', '', ''],
        ['TA-02: O&M Support', 'PWS Section 3.2', '✓ (p. 8)', 'Partial (p. 9)', '✓ (p. 5)', '✓ (p. 10)', '✓ (p. 6)', 'Missing', '✓ (p. 8)', '', ''],
        ['TA-03: Development & Modernization', 'PWS Section 3.3', '✓ (p. 10)', '✓ (p. 11)', '✓ (p. 8)', 'Partial (p. 12)', '✓ (p. 9)', '✓ (p. 7)', 'Missing', '', ''],
        ['TA-04: Transition In', 'PWS Section 3.4', 'Partial (p. 12)', '✓ (p. 13)', '✓ (p. 10)', '✓ (p. 14)', 'Missing', '✓ (p. 9)', '✓ (p. 11)', '', ''],
        ['TA-05: Transition Out', 'PWS Section 3.5', '✓ (p. 14)', 'Missing', 'Partial (p. 12)', '✓ (p. 15)', '✓ (p. 11)', '✓ (p. 10)', '✓ (p. 13)', '', ''],
        ['Risk Management', 'PWS Section 4.1', '✓ (p. 15)', '✓ (p. 14)', '✓ (p. 13)', 'Partial (p. 13)', '✓ (p. 12)', '✓ (p. 11)', '✓ (p. 14)', '', ''],
        ['Project Management Plan', 'PWS Section 4.2', '✓ (p. 6)', 'Partial (p. 8)', '✓ (p. 7)', '✓ (p. 11)', '✓ (p. 8)', 'Missing', '✓ (p. 9)', '', ''],
        ['Communication Plan', 'PWS Section 4.3', '✓ (p. 7)', '✓ (p. 9)', 'Missing', '✓ (p. 12)', 'Partial (p. 9)', '✓ (p. 8)', '✓ (p. 10)', '', ''],
        ['Staffing Plan', 'PWS Section 4.4', 'Partial (p. 9)', '✓ (p. 10)', '✓ (p. 9)', '✓ (p. 13)', '✓ (p. 10)', '✓ (p. 9)', 'Missing', '', ''],
        ['Organizational Structure', 'PWS Section 4.5', '✓ (p. 11)', '✓ (p. 12)', '✓ (p. 11)', 'Missing', '✓ (p. 11)', 'Partial (p. 10)', '✓ (p. 12)', '', ''],
        ['Agile Knowledge/Examples', 'PWS Section 5.1', '✓ (p. 13)', 'Partial (p. 15)', '✓ (p. 14)', '✓ (p. 14)', 'Missing', '✓ (p. 12)', '✓ (p. 15)', '', '']
    ];
    
    requirements.forEach(req => {
        const row = traceabilityMatrix.addRow(req);
        row.height = 25;
        row.getCell(1).style = vendorStyle;
        row.getCell(2).style = vendorStyle;
        
        // Color code the compliance status
        for (let i = 3; i <= 12; i++) {
            const cell = row.getCell(i);
            cell.style = dataStyle;
            if (cell.value && cell.value.toString().includes('✓')) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } }; // Light green
            } else if (cell.value && cell.value.toString().includes('Partial')) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } }; // Light yellow
            } else if (cell.value && cell.value.toString().includes('Missing')) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } }; // Light red
            }
        }
    });
    
    traceabilityMatrix.columns = [
        { width: 25 },
        { width: 15 },
        ...Array(10).fill({ width: 12 })
    ];
    
    // Sheet 12: Compliance Checklist
    const complianceChecklist = workbook.addWorksheet('Compliance Checklist');
    complianceChecklist.tabColor = { argb: 'C00000' }; // Red tab
    
    const headers12 = ['Vendor', 'Volume One ≤ 15 pages', 'Personnel resumes ≤ 3 pages each', 'No pricing in Volume One', '3 prior experience refs or less', 'Draft PMP included', 'Agile examples provided', 'All task areas addressed'];
    const headerRow12 = complianceChecklist.addRow(headers12);
    styleHeaders(complianceChecklist, headerRow12);
    
    // Add rows for all 10 possible vendors with formulas
    for (let i = 0; i < 10; i++) {
        const row = complianceChecklist.addRow([
            { formula: `IF('Vendor Mapping'!C${i+2}="Active",'Vendor Mapping'!B${i+2},"")` },
            '', '', '', '', '', '', ''
        ]);
        row.height = 25;
        row.getCell(1).style = vendorStyle;
        
        // Style compliance cells
        for (let j = 2; j <= 8; j++) {
            const cell = row.getCell(j);
            cell.style = {
                ...dataStyle,
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } }
            };
        }
    }
    
    complianceChecklist.columns = Array(8).fill({ width: 18 });
    
    // Add data validation for compliance status
    const complianceOptions = ['Compliant', 'Non-Compliant', 'Partial'];
    for (let i = 2; i <= 11; i++) {
        for (let j = 2; j <= 8; j++) {
            const cell = complianceChecklist.getCell(i, j);
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"' + complianceOptions.join(',') + '"']
            };
        }
    }
    
    // Write the file
    await workbook.xlsx.writeFile('RFQ_Evaluation_Matrix_Formatted.xlsx');
    
    console.log('Enhanced Excel file "RFQ_Evaluation_Matrix_Formatted.xlsx" has been created successfully!');
    console.log('✨ Features added:');
    console.log('• Professional color scheme with blue headers');
    console.log('• Alternating row colors for better readability');
    console.log('• Bold vendor names with gray backgrounds');
    console.log('• Colored sheet tabs for easy navigation');
    console.log('• Data validation dropdowns for confidence ratings');
    console.log('• Conditional formatting in traceability matrix');
    console.log('• Proper column widths and row heights');
    console.log('• Wrapped text in headers for better display');
    console.log('• Professional borders and alignment');
}

// Run the function
createFormattedRFQEvaluationMatrix().catch(console.error);