const XLSX = require('xlsx');

function createRFQEvaluationMatrix() {
    const workbook = XLSX.utils.book_new();
    
    // Define vendors A-G
    const vendors = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E', 'Vendor F', 'Vendor G'];
    
    // Sheet 1: Master Summary
    const masterSummary = [
        ['Vendor', 'Factor 1: Prior Experience\n(Most Important)', 'Factor 2.1: Technical Approach\n(Important)', 'Factor 2.2: Management Approach\n(Important)', 'Factor 3: Price\n(Least Important)', 'Overall Assessment', 'Rank'],
        ...vendors.map(vendor => [vendor, '[Confidence Rating]', '[Confidence Rating]', '[Confidence Rating]', '$[Amount]', '[Best Value Score]', '[1-7]'])
    ];
    
    // Add confidence rating definitions
    masterSummary.push([]);
    masterSummary.push(['Confidence Rating Definitions:']);
    masterSummary.push(['High Confidence:', 'The Government has high confidence that the Offeror understands the requirement, proposes a sound approach, and will be successful in performing the contract.']);
    masterSummary.push(['Some Confidence:', 'The Government has some confidence that the Offeror understands the requirement, proposes a sound approach, and will be successful in performing the contract.']);
    masterSummary.push(['Low Confidence:', 'The Government has low confidence that the Offeror understands the requirement, proposes a sound approach, and will be successful in performing the contract.']);
    
    const ws1 = XLSX.utils.aoa_to_sheet(masterSummary);
    ws1['!cols'] = [
        { width: 15 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 15 },
        { width: 18 },
        { width: 8 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws1, 'Master Summary');
    
    // Sheet 2: Factor 1 - Prior Experience
    const priorExperience = [
        ['Vendor', 'Reference 1\nScope Match', 'Reference 1\nComplexity Match', 'Reference 1\nSize ($)', 'Reference 1\nEvaluator Notes', 'Reference 2\nScope Match', 'Reference 2\nComplexity Match', 'Reference 2\nSize ($)', 'Reference 2\nEvaluator Notes', 'Overall Prior Experience Rating'],
        ...vendors.map(vendor => [vendor, '[High/Some/Low]', '[High/Some/Low]', '[$ Value]', '[Notes]', '[High/Some/Low]', '[High/Some/Low]', '[$ Value]', '[Notes]', '[Confidence Rating]'])
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(priorExperience);
    ws2['!cols'] = Array(10).fill({ width: 15 });
    XLSX.utils.book_append_sheet(workbook, ws2, 'Factor 1 - Prior Experience');
    
    // Sheet 3: Factor 2.1 - Technical Approach
    const technicalApproach = [
        ['Vendor', 'TA-01\nProject Management', 'TA-02\nO&M Support', 'TA-03\nDevelopment & Modernization', 'TA-04\nTransition In', 'TA-05\nTransition Out', 'Risk Management', 'Overall Technical Rating'],
        ...vendors.map(vendor => [vendor, '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Confidence Rating]'])
    ];
    
    const ws3 = XLSX.utils.aoa_to_sheet(technicalApproach);
    ws3['!cols'] = Array(8).fill({ width: 18 });
    XLSX.utils.book_append_sheet(workbook, ws3, 'Factor 2.1 - Technical');
    
    // Sheet 4: Factor 2.2 - Management Approach
    const managementApproach = [
        ['Vendor', 'Project Management Plan', 'Communication Plan', 'Staffing Plan', 'Organizational Structure', 'Agile Knowledge/Examples', 'Overall Management Rating'],
        ...vendors.map(vendor => [vendor, '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Rating + Notes]', '[Confidence Rating]'])
    ];
    
    const ws4 = XLSX.utils.aoa_to_sheet(managementApproach);
    ws4['!cols'] = Array(7).fill({ width: 18 });
    XLSX.utils.book_append_sheet(workbook, ws4, 'Factor 2.2 - Management');
    
    // Sheets 5-8: Individual Evaluator Worksheets
    const evaluators = ['Evaluator 1', 'Evaluator 2', 'Evaluator 3', 'Evaluator 4'];
    
    evaluators.forEach((evaluator, index) => {
        const evaluatorData = [
            [`${evaluator}`, 'Factor 1', 'Factor 2.1', 'Factor 2.2', 'Strengths', 'Weaknesses', 'Questions/Clarifications'],
            ...vendors.map(vendor => [vendor, '[Initial Rating]', '[Initial Rating]', '[Initial Rating]', '[List]', '[List]', '[List]'])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(evaluatorData);
        ws['!cols'] = Array(7).fill({ width: 15 });
        XLSX.utils.book_append_sheet(workbook, ws, evaluator);
    });
    
    // Sheet 9: Consensus Building
    const consensusData = [
        ['Vendor', 'Factor', 'Evaluator 1', 'Evaluator 2', 'Evaluator 3', 'Evaluator 4', 'Consensus Rating', 'Rationale']
    ];
    
    // Add rows for each vendor and factor combination
    vendors.forEach(vendor => {
        consensusData.push([vendor, 'Prior Experience', '[Rating]', '[Rating]', '[Rating]', '[Rating]', '[Final Rating]', '[Justification]']);
        consensusData.push([vendor, 'Technical Approach', '[Rating]', '[Rating]', '[Rating]', '[Rating]', '[Final Rating]', '[Justification]']);
        consensusData.push([vendor, 'Management Approach', '[Rating]', '[Rating]', '[Rating]', '[Rating]', '[Final Rating]', '[Justification]']);
    });
    
    const ws9 = XLSX.utils.aoa_to_sheet(consensusData);
    ws9['!cols'] = Array(8).fill({ width: 15 });
    XLSX.utils.book_append_sheet(workbook, ws9, 'Consensus Building');
    
    // Sheet 10: Price Analysis
    const priceAnalysis = [
        ['Vendor', 'Total Price', 'Price Rank', 'Technical Score', 'Price/Technical Ratio', 'Best Value Assessment'],
        ...vendors.map(vendor => [vendor, '$[Amount]', '[1-7]', '[Combined F1 & F2 Score]', '[Ratio]', '[Narrative]'])
    ];
    
    const ws10 = XLSX.utils.aoa_to_sheet(priceAnalysis);
    ws10['!cols'] = Array(6).fill({ width: 18 });
    XLSX.utils.book_append_sheet(workbook, ws10, 'Price Analysis');
    
    // Sheet 11: Traceability Matrix
    const traceabilityData = [
        ['PWS Requirement', 'Page Reference', 'Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E', 'Vendor F', 'Vendor G'],
        ['TA-01: Project Management', 'PWS Section X.X', '✓ (p. X)', '✓ (p. X)', 'Partial (p. X)', '✓ (p. X)', 'Missing', '✓ (p. X)', '✓ (p. X)'],
        ['TA-02: O&M Support', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['TA-03: Development & Modernization', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['TA-04: Transition In', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['TA-05: Transition Out', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['Risk Management', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['Project Management Plan', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['Communication Plan', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['Staffing Plan', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['Organizational Structure', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]'],
        ['Agile Knowledge/Examples', 'PWS Section X.X', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]', '[Status]']
    ];
    
    const ws11 = XLSX.utils.aoa_to_sheet(traceabilityData);
    ws11['!cols'] = [
        { width: 25 },
        { width: 15 },
        ...Array(7).fill({ width: 12 })
    ];
    XLSX.utils.book_append_sheet(workbook, ws11, 'Traceability Matrix');
    
    // Sheet 12: Compliance Checklist
    const complianceData = [
        ['Vendor', 'Volume One ≤ 15 pages', 'Personnel resumes ≤ 3 pages each', 'No pricing in Volume One', 'Exactly 2 prior experience refs', 'Draft PMP included', 'Agile examples provided', 'All task areas addressed'],
        ...vendors.map(vendor => [vendor, '☐', '☐', '☐', '☐', '☐', '☐', '☐'])
    ];
    
    const ws12 = XLSX.utils.aoa_to_sheet(complianceData);
    ws12['!cols'] = Array(8).fill({ width: 15 });
    XLSX.utils.book_append_sheet(workbook, ws12, 'Compliance Checklist');
    
    // Write the file
    XLSX.writeFile(workbook, 'RFQ_Evaluation_Matrix.xlsx');
    
    console.log('Excel file "RFQ_Evaluation_Matrix.xlsx" has been created successfully!');
    console.log('The file contains 12 sheets:');
    console.log('1. Master Summary');
    console.log('2. Factor 1 - Prior Experience');
    console.log('3. Factor 2.1 - Technical');
    console.log('4. Factor 2.2 - Management');
    console.log('5-8. Individual Evaluator Worksheets (4 sheets)');
    console.log('9. Consensus Building');
    console.log('10. Price Analysis');
    console.log('11. Traceability Matrix');
    console.log('12. Compliance Checklist');
}

// Run the function
createRFQEvaluationMatrix();