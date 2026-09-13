//Sort by clicking the header

const header = document.getElementById('table_header');

header.addEventListener('click', (e) => {
  const th = e.target.closest('th');
  if (!th || !th.id.startsWith('table_')) return;

  const sortKey = th.id.replace('table_', '');
  const url = new URL(window.location.href);
  const currentSort = url.searchParams.get('sort');
  const currentOrder = url.searchParams.get('order');

  const newOrder = (currentSort === sortKey && currentOrder === 'asc') ? 'desc' : 'asc';

  url.searchParams.set('sort', sortKey);
  url.searchParams.set('order', newOrder);

  window.location.href = url.toString();
});

//Load Vendor Filter Bar

async function loadVendorFilters() {
    const response = await fetch('/vendors'); //GET json only filled with unique Vendor.
    const vendors = await response.json();

    const params = new URLSearchParams(window.location.search);
    const selectedVendors = params.getAll('vendor');

    const filterBar = document.getElementById('vendor-filter-bar');
    filterBar.innerHTML = '<p class = "filter-name">Vendor</p>';

    vendors.forEach(vendor => { //Create a checkbox for each vendor.
        const label = document.createElement('label');
        label.className = 'vendor-filter';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'vendor-checkbox';
        checkbox.value = vendor;
        checkbox.checked = selectedVendors.includes(vendor);

        checkbox.addEventListener('change', updateVendorFilter);

        label.appendChild(checkbox);
        label.append(' ' + vendor);
        filterBar.appendChild(label);
    });
}

function updateVendorFilter() { //Reload page to apply the filter
    const params = new URLSearchParams(window.location.search);
    params.delete('vendor');

    document.querySelectorAll('.vendor-checkbox:checked').forEach(checked => {
        params.append('vendor', checked.value);
    });

    window.location.search = params.toString();
}

loadVendorFilters();

//Filter by status

const statuscheckboxes = document.querySelectorAll('.status-checkbox');

statuscheckboxes.forEach(checkbox =>{
    checkbox.addEventListener('change', updateStatusCheckbox);
})

function updateStatusCheckbox(){
    const params = new URLSearchParams(window.location.search);
    params.delete('status');
    document.querySelectorAll('.status-checkbox:checked').forEach(checked => {
        params.append('status', checked.value);
    });

    window.location.search = params.toString();
}

function rememberStatusCheckbox(){ //Remember filter option when reload the page
    const params = new URLSearchParams(window.location.search);
    const allStatus = params.getAll('status');
    for(curStatus of allStatus){
        
        for(curBox of statuscheckboxes){
            if(curBox.value == curStatus)
            curBox.checked = true;
        }
    }
}

rememberStatusCheckbox();

//Clear Filter Btn

const clearbtn = document.getElementById('clear-btn');

clearbtn.addEventListener('change',() =>{
    window.location.search = "/";
})

//Pagination

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    function goToPage(pageNum) {
        params.set("page", pageNum);
        window.location.search = params.toString();
    }

    document.getElementById("prev-page")?.addEventListener("click", () => {
        const current = parseInt(document.getElementById("page-input").value, 10);
        goToPage(current - 1);
    });

    document.getElementById("next-page")?.addEventListener("click", () => {
        const current = parseInt(document.getElementById("page-input").value, 10);
        goToPage(current + 1);
    });

    document.getElementById("page-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = parseInt(document.getElementById("page-input").value, 10);
        const max = parseInt(document.getElementById("page-input").max, 10);
        const clamped = Math.max(1, Math.min(value, max));
        goToPage(clamped);
    });
});

//Option to update / delete receipts

const receiptsAllRows = document.querySelectorAll('.receipt-row');
receiptsAllRows.forEach( row =>{
    row.addEventListener('contextmenu', receiptModifyOption);
})

function receiptModifyOption(event){
    event.preventDefault();

}

//Delete receipt function
const deleteButtons = document.querySelectorAll('.receipt-status');

deleteButtons.forEach(td => {
    td.addEventListener('click', (e) => {
        const receiptId = e.target.closest('tr').dataset.receiptId;
        console.log(receiptId);
        //deleteReceipt(receiptId);
    });
});

async function deleteReceipt(receiptId) {
    try{
        const response = await fetch(`/receipts/${receiptId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            // Remove the row from the table
            const row = document.querySelector(`[data-receipt-id="${receiptId}"]`);
            if (row) {
                row.remove();
            }
        }
    } catch (error) {
        console.error('Error deleting receipt:', error);
    }
}