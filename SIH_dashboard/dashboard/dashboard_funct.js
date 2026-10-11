const institutions=document.getElementById("institutions-op");
institutions.addEventListener("click",()=>{
    window.location.href='../institutions/institutions_index.html';
});
const dashboard=document.getElementById("dashboard-op");
dashboard.addEventListener('click',()=>{
    window.location.reload();
})
const inspections=document.getElementById("inspections-op");
inspections.addEventListener("click",()=>{
    window.location.href="../inspections/inspections_index.html";
});
const issues=document.getElementById("issues-op");
issues.addEventListener("click",()=>{
    window.location.href="../option-issues/issues_index.html";
});
const analytics=document.getElementById("analytics-op");
analytics.addEventListener('click',()=>{
    window.location.href="../analytics/analytics_index.html"
});

const BASE_URL = ''; 

async function loadDashboardData() {
    try {
        
        const [institutionsRes, inspectionsRes] = await Promise.all([
            fetch(`http://127.0.0.1:8000/api/institutions`),
            fetch(`http://127.0.0.1:8000/api/inspections`)
        ]);

        if (!institutionsRes.ok || !inspectionsRes.ok) {
            throw new Error('Failed to fetch data from API endpoints');
        }

        const institutions = await institutionsRes.json();
        const inspections = await inspectionsRes.json();

        
        const totalInstitutions = institutions.length;
        document.querySelector('.institutes .casecurrnum').textContent = totalInstitutions;

        
        const uniqueInspectors = new Set(inspections.map(item => item.inspector).filter(Boolean));
        document.querySelector('.inspectors .casecurrnum').textContent = uniqueInspectors.size;

        
        const pendingCount = inspections.filter(item => !item.facilityOk || !item.hygieneOk || !item.documentsOk).length;
        document.querySelector('.pending .casecurrnum').textContent = pendingCount;


        
        const tableBody = document.querySelector('#current-status-table tbody');
        if (tableBody) {
            
            tableBody.innerHTML = '';

            
            inspections.forEach(item => {
                const tr = document.createElement('tr');

                
                let statusText = '✅ Completed';
                if (item.flagged === true) {
                    statusText = '⚠️ Flagged';
                } else if (!item.facilityOk || !item.hygieneOk || !item.documentsOk) {
                    statusText = '⏳ Pending';
                }

                
                const dateObj = new Date(item.timestamp);
                const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                
                tr.innerHTML = `
                    <th>${item.institutionName || 'Unknown Centre'}</th>
                    <td>${item.inspector || 'N/A'}</td>
                    <td>${formattedDate}</td>
                    <td>${statusText}</td>
                `;

                tableBody.appendChild(tr);
            });
        }

    } catch (error) {
        console.error('Error dashboard connection metrics:', error);
    }
}


document.addEventListener('DOMContentLoaded', loadDashboardData);
