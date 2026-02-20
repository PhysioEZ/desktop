export const printToken = (data: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write('<html><head><title>Print Token</title>');
    doc.write('<style>');
    doc.write('@page { size: 80mm auto; margin: 0; }'); 
    doc.write('body { margin: 0 auto; padding: 2mm; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 11px; color: #000; width: 72mm; max-width: 72mm; box-sizing: border-box; }');
    doc.write('* { box-sizing: border-box; }');
    doc.write('.text-center { text-align: center; }');
    doc.write('.text-right { text-align: right; }');
    doc.write('.uppercase { text-transform: uppercase; }');
    doc.write('.font-bold { font-weight: bold; }');
    doc.write('.font-black { font-weight: 900; }');
    doc.write('.font-mono { font-family: monospace; }');
    doc.write('.border-black { border-color: #000; }');
    doc.write('.border-b-2 { border-bottom: 1.5px solid #000; }');
    doc.write('.border-t-2 { border-top: 1.5px solid #000; }');
    doc.write('.border-t { border-top: 0.5px solid #000; }');
    doc.write('.border-2 { border: 2px solid #000; }');
    doc.write('.border-dashed { border-style: dashed; }');
    doc.write('.rounded-lg { border-radius: 4px; }');
    doc.write('.flex { display: flex; }');
    doc.write('.flex-1 { flex: 1; min-width: 0; }');
    doc.write('.justify-between { justify-content: space-between; }');
    doc.write('.items-center { align-items: center; }');
    doc.write('.mb-4 { margin-bottom: 0.5rem; }');
    doc.write('.mb-2 { margin-bottom: 0.25rem; }');
    doc.write('.mb-1 { margin-bottom: 0.125rem; }');
    doc.write('.mt-2 { margin-top: 0.25rem; }'); 
    doc.write('.pb-2 { padding-bottom: 0.25rem; }');
    doc.write('.pt-2 { padding-top: 0.25rem; }');
    doc.write('.text-xl { font-size: 14pt; line-height: 1.2; }');
    doc.write('.text-4xl { font-size: 24pt; line-height: 1; }');
    doc.write('.text-xs { font-size: 9pt; line-height: 1.1; }');
    doc.write('#token-print-area { position: relative; page-break-inside: avoid; break-inside: avoid; }');
    doc.write('.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 70px; font-weight: 900; color: rgba(0, 0, 0, 0.08); white-space: nowrap; z-index: -1; pointer-events: none; text-transform: uppercase; letter-spacing: 5px; }');
    doc.write('</style>');
    doc.write('</head><body>');

    const htmlContent = `
        <div id="token-print-area">
            ${data.has_token_today ? '<div class="watermark">REPRINT</div>' : ''}
            <div class="text-center mb-2">
                <h1 class="font-black text-xl uppercase tracking-wider mb-1">${(data.clinic_name || 'PROSPINE').toUpperCase()}</h1>
                <p class="text-[10px] uppercase font-bold text-center w-full">${(data.branch_address || 'Swami Vivika Nand Road').toUpperCase()}</p>
                <p class="text-[10px] uppercase font-bold mb-2">Ph: ${data.branch_phone || '+91-8002910021'}</p>
                
                <div class="border-t-2 border-dashed border-black my-1"></div>
                
                <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                    <span>TOKEN #:</span>
                    <span>${data.token_uid?.split('-').pop() || '--'}</span>
                </div>
                 <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                    <span>DATE:</span>
                    <span class="uppercase">${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                 <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                    <span>PATIENT:</span>
                    <span class="uppercase text-right truncate" style="max-width: 40mm;">${data.patient_name}</span>
                </div>
                 <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-2">
                    <span>DOCTOR:</span>
                    <span class="uppercase text-right">${data.assigned_doctor || 'NOT ASSIGNED'}</span>
                </div>
                
                <div class="border-t-2 border-dashed border-black my-2"></div>
            </div>

            <div class="mb-4" style="text-align: center; width: 100%;">
                <p class="text-xs font-bold uppercase mb-2">YOUR TOKEN NUMBER</p>
                <span class="font-black font-mono block leading-none" style="font-size: 80px; display: block; margin: 0 auto; line-height: 1;">${data.token_uid?.split('-').pop() || '00'}</span>
            </div>
            
            <div class="border-t-2 border-dashed border-black my-2"></div>

             <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                <span>TREATMENT:</span>
                <span>${data.attendance_progress?.replace('/', ' / ') || '1 / 1'}</span>
            </div>
             <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                <span>AMT PAID:</span>
                <span>₹${parseFloat(data.paid_today || '0').toLocaleString('en-IN')}</span>
            </div>
             <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                <span>DUES:</span>
                <span>₹${parseFloat(data.due_amount || '0').toLocaleString('en-IN')}</span>
            </div>
             <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-1">
                <span>PKG DUES:</span>
                <span>₹0</span>
            </div>
             <div class="flex justify-between text-xs font-bold font-mono leading-tight mb-2">
                <span>WALLET BAL:</span>
                <span>₹${parseFloat(data.effective_balance || '0').toLocaleString('en-IN')}</span>
            </div>

            <div class="border-t-2 border-dashed border-black my-2"></div>

            <div class="text-center mt-4">
                <p class="font-bold text-sm mb-1">PLEASE WAIT FOR YOUR TURN</p>
                <p class="text-[10px] font-mono">System Generated Token</p>
            </div>
        </div>
    `;

    doc.write(htmlContent);
    doc.write('</body></html>');
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
    }, 500);
};

export const printA4Token = (data: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write('<html><head><title>Token Slip</title>');
    doc.write('<style>');
    doc.write('@page { size: A4; margin: 20mm; }');
    doc.write('body { font-family: "Inter", Arial, sans-serif; color: #000; line-height: 1.6; }');
    doc.write('.text-center { text-align: center; }');
    doc.write('.text-right { text-align: right; }');
    doc.write('.font-bold { font-weight: bold; }');
    doc.write('.token-box { border: 2px dashed #000; padding: 40px 20px; text-align: center; margin: 30px 0; background: #f9f9f9; border-radius: 20px; }');
    doc.write('.header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: start; }');
    doc.write('.clinic-title { font-size: 24px; font-weight: 800; text-transform: uppercase; margin: 0; }');
    doc.write('.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; font-size: 14px; }');
    doc.write('.label { font-size: 11px; text-transform: uppercase; color: #555; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }');
    doc.write('.val { font-size: 16px; font-weight: 600; }');
    doc.write('.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 151px; font-weight: 900; color: rgba(0, 0, 0, 0.05); white-space: nowrap; z-index: -1; pointer-events: none; text-transform: uppercase; letter-spacing: 20px; }');
    doc.write('</style></head><body>');
    
    const html = `
        ${data.has_token_today ? '<div class="watermark">REPRINT</div>' : ''}
        <div class="header">
            <div>
                <h1 class="clinic-title">${(data.clinic_name || 'Clinic').toUpperCase()}</h1>
                <p style="margin:5px 0 0 0; font-size:12px;">${data.branch_address}</p>
                <p style="margin:0; font-size:12px;">Ph: ${data.branch_phone}</p>
            </div>
            <div class="text-right">
                <h2 style="margin:0; font-size:18px; font-weight:900;">TOKEN SLIP</h2>
                <p style="margin:5px 0 0 0;">${new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })}</p>
                <p style="margin:0; font-size:12px;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit', hour12: true })}</p>
            </div>
        </div>

        <div class="token-box">
            <p class="label" style="font-size: 14px;">YOUR TOKEN NUMBER</p>
            <h1 style="font-size: 120px; margin: 10px 0; line-height:1; font-weight:900;">${data.token_uid?.split('-').pop() || '00'}</h1>
            <p style="font-size: 16px; font-weight: bold; margin-top: 10px;">PLEASE WAIT FOR YOUR TURN</p>
        </div>

        <div class="details-grid">
            <div>
                <p class="label">Patient Name</p>
                <p class="val">${data.patient_name}</p>
            </div>
             <div>
                <p class="label">Patient UID</p>
                <p class="val">#${data.patient_uid}</p>
            </div>
             <div>
                <p class="label">Treatment Phase</p>
                <p class="val">${data.attendance_progress?.replace('/', ' / ') || '-'}</p>
            </div>
             <div>
                <p class="label">Assigned Doctor</p>
                <p class="val">${data.assigned_doctor || 'Not Assigned'}</p>
            </div>
        </div>

        <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 40px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                <span class="label" style="margin:0;">Paid Today</span>
                <span class="font-bold">₹${parseFloat(data.paid_today || '0').toLocaleString('en-IN', { minimumFractionDigits: 2})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px;">
                <span class="label" style="margin:0; font-size: 14px; align-self: center;">Wallet Balance</span>
                <span style="font-weight:900; color:${data.effective_balance < 0 ? '#b91c1c' : '#15803d'}">₹${parseFloat(data.effective_balance || '0').toLocaleString('en-IN', { minimumFractionDigits: 2})}</span>
            </div>
        </div>

        <div class="footer">
            System Generated Token • ${data.token_uid} • Valid for today only
        </div>
    `;

    doc.write(html);
    doc.write('</body></html>');
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 500);
};

export const printPatientStatement = (data: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Calculate Totals & Breakdown
    const payments = data.payments_history || [];
    let totalPaidCalculated = 0;
    const byRemark: Record<string, number> = {};

    payments.forEach((p: any) => {
        let remark = p.remarks || 'Unspecified';
        if (remark.startsWith('Daily') || remark.startsWith('Advance attendance')) remark = 'Treatment Payment';
        if (remark.startsWith('Initial')) remark = 'Advance/Registration';

        const amt = parseFloat(p.amount || 0);
        totalPaidCalculated += amt;
        byRemark[remark] = (byRemark[remark] || 0) + amt;
    });

    const primaryColor = '#16a34a';
    const lightBg = '#f0fdf4';

    doc.open();
    doc.write('<html><head><title>Patient Statement</title>');
    doc.write('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">');
    doc.write('<style>');
    doc.write('@page { size: A4; margin: 10mm; }');
    doc.write('body { font-family: "Inter", Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 8.5pt; margin: 0; padding: 0; }');
    doc.write('.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid ' + primaryColor + '; }');
    doc.write('.clinic-name { font-size: 18pt; font-weight: 800; color: ' + primaryColor + '; margin: 0; letter-spacing: -0.5px; }');
    doc.write('.clinic-tagline { font-size: 8pt; font-weight: 600; color: #64748b; margin: 2px 0 0 0; }');
    doc.write('.clinic-info { font-size: 7.5pt; color: #64748b; margin-top: 3px; }');
    doc.write('.stmt-badge { background: ' + primaryColor + '; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; display: inline-block; }');
    
    doc.write('.summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; }');
    doc.write('.stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); break-inside: avoid; }');
    doc.write('.stat-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 2px; }');
    doc.write('.stat-value { font-size: 14pt; font-weight: 800; color: #0f172a; }');
    doc.write('.stat-card.highlight { background: ' + lightBg + '; border-color: ' + primaryColor + '; }');
    doc.write('.stat-card.highlight .stat-value { color: ' + primaryColor + '; }');
    doc.write('.stat-card.danger .stat-value { color: #dc2626; }');

    doc.write('.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }');
    doc.write('.info-box { background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; break-inside: avoid; }');
    doc.write('.box-title { font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; display: flex; align-items: center; gap: 8px; }');
    doc.write('.info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 8.5pt; }');
    doc.write('.info-label { color: #64748b; font-weight: 500; }');
    doc.write('.info-val { font-weight: 600; color: #334155; text-align: right; }');

    doc.write('.table-container { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 15px; }');
    doc.write('table { width: 100%; border-collapse: collapse; }');
    doc.write('th { background: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 8pt; padding: 8px 12px; text-align: left; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }');
    doc.write('td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 8.5pt; }');
    doc.write('tr { break-inside: auto; }');
    doc.write('tr:last-child td { border-bottom: none; }');
    doc.write('.text-right { text-align: right; }');
    
    doc.write('.footer { text-align: center; color: #94a3b8; font-size: 7.5pt; margin-top: 30px; padding-top: 15px; border-top: 1px dashed #e2e8f0; }');
    doc.write('</style>');
    doc.write('</head><body>');

    const htmlContent = `
        <div class="header">
            <div>
                <h1 class="clinic-name">${(data.clinic_name || 'PROSPINE CLINIC').toUpperCase()}</h1>
                <p class="clinic-tagline">Advanced Spine & Physiotherapy Center</p>
                <div class="clinic-info">
                    ${data.branch_address}<br>
                    Phone: ${data.branch_phone}
                </div>
            </div>
            <div style="text-align: right;">
                <div class="stmt-badge">Patient Statement</div>
                <div style="margin-top: 10px; color: #64748b; font-size: 10pt;">
                    <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </div>

        <!-- Financial Summary Cards -->
        <div class="summary-grid">
            <div class="stat-card">
                <div class="stat-label">Total Paid</div>
                <div class="stat-value">₹${totalPaidCalculated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card highlight">
                <div class="stat-label">Wallet Balance</div>
                <div class="stat-value">₹${parseFloat(data.effective_balance || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card ${data.due_amount > 0 ? 'danger' : ''}">
                <div class="stat-label">Total Due</div>
                <div class="stat-value">₹${parseFloat(data.due_amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
        </div>

        <!-- Details Grid -->
        <div class="info-grid">
            <!-- Patient Info -->
            <div class="info-box">
                <div class="box-title">Patient Details</div>
                <div class="info-row">
                    <span class="info-label">Name</span>
                    <span class="info-val" style="font-size: 12pt; color: #0f172a;">${data.patient_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Patient ID</span>
                    <span class="info-val">#${data.patient_uid}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone</span>
                    <span class="info-val">${data.patient_phone || data.patient?.phone_number || '-'}</span>
                </div>
                 <div class="info-row">
                    <span class="info-label">Assigned Doctor</span>
                    <span class="info-val">${data.assigned_doctor || 'Not Assigned'}</span>
                </div>
            </div>

            <!-- Treatment Plan -->
            <div class="info-box">
                <div class="box-title">Treatment Plan</div>
                <div class="info-row">
                    <span class="info-label">Plan Type</span>
                    <span class="info-val badge" style="color:${primaryColor}; text-transform:uppercase;">${data.treatment_type || 'General'}</span>
                </div>
                ${data.start_date ? `
                    <div class="info-row">
                        <span class="info-label">Period</span>
                        <span class="info-val">${new Date(data.start_date).toLocaleDateString('en-GB')} - ${new Date(data.end_date).toLocaleDateString('en-GB')}</span>
                    </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Sessions Completed</span>
                    <span class="info-val">${data.attendance_progress?.replace('/', ' / ') || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Plan Cost</span>
                    <span class="info-val">₹${parseFloat(data.total_plan_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
        
        ${Object.keys(byRemark).length > 0 ? `
            <div class="info-box" style="margin-bottom: 15px; background: white; border: 1px dashed #e2e8f0;">
                <div class="box-title" style="border:none; padding-bottom:0;">Payment Summary Breakdown</div>
                <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">
                     ${Object.entries(byRemark).map(([remark, amt]) => `
                        <div style="flex:1; min-width: 150px;">
                            <div style="font-size: 8.5pt; color: #64748b;">${remark}</div>
                            <div style="font-size: 10pt; font-weight: 700; color: #0f172a;">₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div style="margin-bottom: 15px;">
            <div class="box-title" style="border:none; margin-bottom: 5px;">Payment History</div>
            ${payments.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description / Remark</th>
                                <th>Mode</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map((p: any) => `
                                <tr>
                                    <td>${new Date(p.payment_date).toLocaleDateString('en-GB')}</td>
                                    <td>
                                        <div style="font-weight:600;">${p.remarks || '-'}</div>
                                    </td>
                                     <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:8pt; text-transform:uppercase; font-weight:600;">${(p.mode || '-')}</span></td>
                                    <td class="text-right" style="font-weight:600;">₹${parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div style="padding: 20px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 12px;">No payment history found.</div>'}
        </div>



        <div class="footer">
            Generated on ${new Date().toLocaleString()} • ${data.token_uid || ''}<br>
            Thank you for choosing ${data.clinic_name}!
        </div>
    `;

    doc.write(htmlContent);
    doc.write('</body></html>');
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
    }, 500);
}


