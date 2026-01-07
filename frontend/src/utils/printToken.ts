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
    doc.write('.mt-2 { margin-top: 0.25rem; }'); // Added based on visual needs
    doc.write('.pb-2 { padding-bottom: 0.25rem; }');
    doc.write('.pt-2 { padding-top: 0.25rem; }');
    doc.write('.text-xl { font-size: 14pt; line-height: 1.2; }');
    doc.write('.text-4xl { font-size: 24pt; line-height: 1; }');
    doc.write('.text-xs { font-size: 9pt; line-height: 1.1; }');
    doc.write('#token-print-area { page-break-inside: avoid; break-inside: avoid; }');
    doc.write('</style>');
    doc.write('</head><body>');

    // Build the HTML Content using Data
    const htmlContent = `
        <div id="token-print-area">
            <div class="text-center mb-2 border-b-2 border-black pb-2">
                <h1 class="font-black text-xl uppercase tracking-wider">ProSpine Clinic</h1>
                <p class="text-xs">Advanced Spine & Pain Care</p>
                <p class="text-xs font-mono mt-1">${data.token_date || new Date().toLocaleDateString()}</p>
            </div>

            <div class="text-center my-4">
                <p class="text-xs font-bold uppercase mb-1">Your Token Number</p>
                <div class="border-2 border-black rounded-lg py-3 px-2 mb-2">
                    <span class="text-4xl font-black font-mono block">${data.token_uid.split('-').pop()}</span>
                    <span class="text-xs font-mono block mt-1 tracking-widest">${data.token_uid}</span>
                </div>
                <p class="text-xs font-bold mt-2">Doctor: ${data.assigned_doctor || 'Assigned'}</p>
            </div>

            <div class="border-t border-dashed border-black pt-2 mb-2">
                <div class="flex justify-between text-xs mb-1">
                    <span class="font-bold">Patient:</span>
                    <span class="uppercase text-right truncate" style="max-width: 40mm;">${data.patient_name}</span>
                </div>
                 <div class="flex justify-between text-xs mb-1">
                    <span>ID:</span>
                    <span>#${data.patient_uid || data.patient_id}</span>
                </div>
                 <div class="flex justify-between text-xs mb-1">
                    <span>Attend:</span>
                    <span>${data.attendance_progress}</span>
                </div>
            </div>

            <div class="bg-gray-100 border-t-2 border-black pt-2">
                 <div class="flex justify-between text-xs mb-1">
                    <span class="font-bold">Paid Today:</span>
                    <span class="font-bold">₹${parseFloat(data.paid_today || '0').toLocaleString()}</span>
                </div>
                 <div class="flex justify-between text-xs mb-1">
                    <span>Previous Due:</span>
                    <span>₹${(parseFloat(data.due_amount || '0') - parseFloat(data.today_due || '0')).toLocaleString()}</span> // Approximation
                </div>
                <div class="flex justify-between text-xs mt-2 font-black border-t border-black pt-1">
                    <span>Total Due:</span>
                    <span>₹${parseFloat(data.remaining_balance || data.due_amount || '0').toLocaleString()}</span>
                </div>
            </div>

            <div class="text-center mt-4 text-[8px] uppercase">
                <p>** PLEASE WAIT FOR YOUR TURN **</p>
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
