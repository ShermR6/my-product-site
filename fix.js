const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const p = new PrismaClient();
  const h = bcrypt.hashSync('password', 10);
  await p.user.update({
    where: { email: 'andrew.p.sherman21@gmail.com' },
    data: { password: h }
  });
  const u = await p.user.findUnique({ where: { email: 'andrew.p.sherman21@gmail.com' } });
  console.log('Stored:', u.password);
  console.log('Verify:', bcrypt.compareSync('password', u.password));
  await p.$disconnect();
}

main();