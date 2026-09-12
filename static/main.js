

const header = document.getElementById('table_header');

header.addEventListener('click', (e) => {
  const th = e.target.closest('th');
  if (!th || !th.id.startsWith('table_')) return;

  const sortKey = th.id.replace('table_', ''); // "vendor", "amount", etc.

  const url = new URL(window.location.href);
  const currentSort = url.searchParams.get('sort');
  const currentOrder = url.searchParams.get('order');

  // toggle order if clicking the same column again, else default to asc
  const newOrder = (currentSort === sortKey && currentOrder === 'asc') ? 'desc' : 'asc';

  url.searchParams.set('sort', sortKey);
  url.searchParams.set('order', newOrder);

  window.location.href = url.toString();

  // trigger your sort/fetch logic here
  // fetchData(url.searchParams);
});