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