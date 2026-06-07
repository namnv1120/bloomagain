const http = require('http');

async function testUpdate() {
  const loginRes = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'bloomagain2024' })
  });
  const { token } = await loginRes.json();

  const getRes = await fetch('http://localhost:5000/api/admin/suggestions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const items = await getRes.json();
  const first = items[0];
  console.log('Original item:', first);

  const updateBody = {
    gender: first.gender,
    age: first.age,
    label: first.label + ' UPDATED',
    icon: first.icon,
    category: first.category
  };

  const putRes = await fetch(`http://localhost:5000/api/admin/suggestions/${first.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateBody)
  });

  console.log('PUT Status:', putRes.status);
  console.log('PUT Body:', await putRes.text());

  const getRes2 = await fetch('http://localhost:5000/api/admin/suggestions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const items2 = await getRes2.json();
  console.log('Updated item:', items2.find(i => i.id === first.id));
}
testUpdate();
