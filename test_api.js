fetch('http://localhost:3000/api/products')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Fetch error:', err));
