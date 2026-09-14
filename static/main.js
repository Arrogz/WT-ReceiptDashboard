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

//Receipt Context Menu to choose between PATCH or DELETE

const receiptsOptionbtn = document.querySelectorAll('.receipt-row');
const contextMenu = document.getElementById('receipt-context-menu');

receiptsOptionbtn.forEach(tr => {
    tr.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 

        activeReceiptId = e.currentTarget.dataset.receiptId;

        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.display = 'block';
    });
});

document.addEventListener('click', (e) => {
    contextMenu.style.display = 'none';
    if (!patchModal.contains(e.target)) {
        patchModal.style.display = 'none';
    }
});

document.getElementById('delete-option').addEventListener('click', () => {
    deleteReceipt(activeReceiptId);
    contextMenu.style.display = 'none';
});


//Patch Option Popup

const patchModal = document.getElementById('patch-modal');
const statusSelect = document.getElementById('status-select');
const confirmPatchBtn = document.getElementById('confirm-patch-btn');

document.getElementById('patch-option').addEventListener('click', (e) => {
    e.stopPropagation(); // don't let the document click handler close things prematurely

    // position it near where the context menu was
    patchModal.style.top = contextMenu.style.top;
    patchModal.style.left = contextMenu.style.left;
    patchModal.style.display = 'block';

    contextMenu.style.display = 'none';
});

confirmPatchBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    const newStatus = statusSelect.value;
    patchReceipt(activeReceiptId, newStatus);

    patchModal.style.display = 'none';
});

function patchReceipt(id, status) {
    console.log('Patch', id, 'to status:', status);
    fetch(`/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error || 'Patch failed'); });
        }
        return res.json();
    })
    .then(updatedReceipt => {
        updateRowUI(id, updatedReceipt.status);
    })
    .catch(err => {
        console.error('Failed to patch receipt:', err);
        alert(`Error: ${err.message}`);
    });
}

function updateRowUI(id, status) {
    const row = document.querySelector(`.receipt-row[data-receipt-id="${id}"]`);
    if (!row) return;

    const statusCell = row.querySelector('.receipt-status');
    statusCell.innerHTML = `<strong>${status}</strong>`;

    if (status === 'Approved') {
        statusCell.style.color = '#7aff75';
    } else if (status === 'Rejected') {
        statusCell.style.color = 'red';
    } else {
        statusCell.style.color = '';
    }
}

//

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
            //window.location.reload();
        }
    } catch (error) {
        console.error('Error deleting receipt:', error);
    }
}