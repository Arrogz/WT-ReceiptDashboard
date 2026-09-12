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

async function loadVendorFilters() {
    const response = await fetch('/vendors');
    const vendors = await response.json();

    const params = new URLSearchParams(window.location.search);
    const selectedVendors = params.getAll('vendor');

    const filterBar = document.getElementById('vendor-filter-bar');
    filterBar.innerHTML = '';

    vendors.forEach(vendor => {
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

function updateVendorFilter() {
    const params = new URLSearchParams(window.location.search);
    params.delete('vendor');

    document.querySelectorAll('.vendor-checkbox:checked').forEach(checked => {
        params.append('vendor', checked.value);
    });

    window.location.search = params.toString();
}

loadVendorFilters();

const statuscheckboxes = document.querySelectorAll('.status-checkbox');

statuscheckboxes.forEach(checkbox =>{
    checkbox.addEventListener('change', updateStatusCheckbox)
})

function updateStatusCheckbox(){
    const params = new URLSearchParams(window.location.search);
    params.delete('status');
    document.querySelectorAll('.status-checkbox:checked').forEach(checked => {
        params.append('status', checked.value);
    });

    window.location.search = params.toString();
}

function rememberStatusCheckbox(){
    const params = new URLSearchParams(window.location.search);
    const allStatus = params.getAll('status');
    for(curStatus of allStatus){
        
        for(curBox of statuscheckboxes){
            if(curBox.value == curStatus)
            curBox.checked = true;
        }
    }
}

rememberStatusCheckbox()

const deleteButtons = document.querySelectorAll('.receipt-status')

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