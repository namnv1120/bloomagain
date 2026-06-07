
async function run() {
  const tokenRes = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'bloomagain2024' })
  });
  const { token } = await tokenRes.json();
  console.log('Token:', token);

  const res = await fetch('http://localhost:5000/api/admin/suggestions/1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      gender: 'Nam',
      age: '13-17 tuổi',
      label: 'Testing update from script',
      icon: '💡',
      category: 'Giáo dục giới tính'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run();
