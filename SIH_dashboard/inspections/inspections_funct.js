const first_option=document.getElementById("op-1");
first_option.addEventListener("click",()=>{
    window.location.href="../Optioninspections/firstinspection.html";
});
const second_option=document.getElementById("op-2");
second_option.addEventListener("click",()=>{
    window.location.href="../Optioninspections/secondinspection.html";
});
const third_option=document.getElementById("op-3");
third_option.addEventListener("click",()=>{
    window.location.href="../Optioninspections/thirdinspection.html";
});
const fourth_option=document.getElementById("op-4");
fourth_option.addEventListener("click",()=>{
    window.location.href="../Optioninspections/fourthinspection.html";
});


fetch('http://127.0.0.1:8000/api/inspections')
    .then(response => response.json())
    .then(inspectionsArray => {
        
        
        inspectionsArray.forEach((item, index) => {
            const rowNumber = index + 1; 
            const row = document.getElementById(`op-${rowNumber}`);
            
            
            if (row) {
                
                const inspectionHeader = `Inspection #${item.id.replace('insp-', '')}`;
                const location = item.institutionName;
                
                
                let status = '✅ Completed';
                if (item.flagged === true) {
                    status = '⚠️ Not Complied';
                } else if (!item.facilityOk || !item.hygieneOk || !item.documentsOk) {
                    status = '⏳ Pending';
                }

                
                const dateObj = new Date(item.timestamp);
                const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                
                row.innerHTML = `
                    <th>${inspectionHeader}</th>
                    <td>${location}</td>
                    <td>${status}</td>
                    <td>${formattedDate}</td>
                `;

                
                const targetPages = {
                    1: "../Optioninspections/firstinspection.html",
                    2: "../Optioninspections/secondinspection.html",
                    3: "../Optioninspections/thirdinspection.html",
                    4: "../Optioninspections/fourthinspection.html"
                };

                // Add a single, clean redirection listener to the optioninspections folder
                row.addEventListener('click', () => {
                    if (targetPages[rowNumber]) {
                        window.location.href = targetPages[rowNumber];
                    }
                });
            }
        });
    })
    .catch(error => console.error('Error processing inspection data:', error));



