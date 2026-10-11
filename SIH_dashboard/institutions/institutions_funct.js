const firstoption=document.getElementById("option-1");
firstoption.addEventListener("click",()=>{
    window.location.href="../option-institutions/1stcentre.html";
});
const secondoption=document.getElementById("option-2");
secondoption.addEventListener("click",()=>{
    window.location.href="../option-institutions/2ndcentre.html";
});
const thirdoption=document.getElementById("option-3");
thirdoption.addEventListener("click",()=>{
    window.location.href="../option-institutions/3rdcentre.html";
});
const fourthoption=document.getElementById("option-4");
fourthoption.addEventListener("click",()=>{
    window.location.href="../option-institutions/4thcentre.html";
});
fetch("http://127.0.0.1:8000/api/institutions")
    .then(response => response.json())
    .then(data => {
        const tableBody = document.querySelector("#institution-table tbody");
        
        
        const headerRow = tableBody.firstElementChild;
        tableBody.innerHTML = ""; 
        tableBody.appendChild(headerRow); 

        data.forEach((item, index) => {
            const row = document.createElement("tr");
            row.id = `option-${index + 1}`;
            row.className = "table-options";

            
            const inspectDate = new Date(item.lastInspection);
            const formattedDate = inspectDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short'
            }); 

            
            let statusBadge = "⏳ Pending";
            if (item.cctv === "online" && item.riskScore < 30) {
                statusBadge = "✅ Completed";
            } else if (item.riskScore >= 50) {
                statusBadge = "⚠️ Flagged";
            }

            
            row.innerHTML = `
                <th>${item.name}</th>
                <td>${item.category}</td> 
                <td>${statusBadge}</td>
                <td>${formattedDate}</td>
            `;

            tableBody.appendChild(row);
        });
    })
    .catch(error => console.error("Error loading table data:", error));

