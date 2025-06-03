const fs = require('fs');

// Generate 50 customers
const customers = [];
const companies = [
  'Tech Solutions AB', 'Digital Innovations', 'Future Systems', 'Smart Tech', 'Nordic Solutions',
  'MegaCorp Industries', 'Global Tech Corporation', 'Innovative Systems', 'NextGen Solutions', 'Alpha Technologies',
  'Beta Dynamics', 'Gamma Enterprises', 'Delta Systems', 'Epsilon Tech', 'Zeta Innovations',
  'Stellar Corporation', 'Quantum Solutions', 'Nano Systems', 'Micro Enterprises', 'Macro Dynamics',
  'Prime Technologies', 'Supreme Systems', 'Ultimate Solutions', 'Advanced Tech', 'Modern Systems',
  'Progressive Solutions', 'Dynamic Enterprises', 'Integrated Systems', 'Unified Technologies', 'Connected Solutions',
  'Smart Innovations', 'Intelligent Systems', 'Automated Solutions', 'Digital Transformation', 'Cloud Technologies',
  'Data Dynamics', 'Analytics Corporation', 'Machine Learning AB', 'AI Solutions', 'Robotics Systems',
  'IoT Innovations', 'Blockchain Technologies', 'Cyber Security', 'Network Solutions', 'Infrastructure Systems',
  'Platform Technologies', 'API Solutions', 'Software Dynamics', 'Hardware Systems', 'Electronics Corporation'
];

const cities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg',
  'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Sundsvall', 'Eskilstuna',
  'Halmstad', 'Växjö', 'Karlstad', 'Kristianstad', 'Falun', 'Skövde', 'Trollhättan', 'Kalmar'
];

const firstNames = [
  'Anna', 'Erik', 'Maria', 'Johan', 'Lisa', 'Peter', 'Emma', 'Anders', 'Sofia', 'Mikael',
  'Karin', 'Magnus', 'Helena', 'Robert', 'Camilla', 'Daniel', 'Susanne', 'Patrik', 'Jenny', 'Mattias',
  'Lars', 'Eva', 'Niklas', 'Sara', 'Björn', 'Linda', 'Thomas', 'Åsa', 'Martin', 'Annika'
];

const lastNames = [
  'Andersson', 'Svensson', 'Lindberg', 'Nilsson', 'Bergström', 'Ekström', 'Johansson', 'Larsson', 'Karlsson', 'Bergman',
  'Holm', 'Olsson', 'Strand', 'Lindqvist', 'Nyberg', 'Forsberg', 'Ek', 'Hedberg', 'Blomqvist', 'Sjöberg',
  'Lundgren', 'Engström', 'Gustafsson', 'Wallin', 'Hansen', 'Petersson', 'Fredriksson', 'Persson', 'Jonsson', 'Carlsson'
];

// Generate customers
for (let i = 1; i <= 50; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const companyName = companies[i-1];
  
  customers.push({
    id: i,
    name: `${firstName} ${lastName}`,
    city: city,
    phone: `070-${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 90) + 10)} ${String(Math.floor(Math.random() * 90) + 10)}`,
    companyName: companyName,
    status: Math.random() > 0.2 ? 'Aktiv' : 'Inaktiv',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.se`,
    customerNumber: `KU-${String(i).padStart(3, '0')}`,
    organizationNumber: `556${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    referenceNumber: Math.random() > 0.3 ? `REF-${String(i).padStart(3, '0')}` : '',
    streetAddress: `${companyName.split(' ')[0]}gatan ${Math.floor(Math.random() * 99) + 1}`,
    postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
    country: 'Sverige',
    billingStreetAddress: Math.random() > 0.5 ? `${companyName.split(' ')[0]}gatan ${Math.floor(Math.random() * 99) + 1}` : `Box ${Math.floor(Math.random() * 999) + 100}`,
    billingPostalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
    billingCity: city,
    billingCountry: 'Sverige',
    switchboardNumber: `0${Math.floor(Math.random() * 89) + 10}-${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 90) + 10)} ${String(Math.floor(Math.random() * 90) + 10)}`,
    companyEmail: `info@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.se`,
    website: `www.${companyName.toLowerCase().replace(/[^a-z]/g, '')}.se`,
    companyNotes: [
      'VIP-kund sedan 2020. Stort företag med många avdelningar.',
      'Intresserad av nya produkter. Snabb betalare.',
      'Kontakta om 3 månader. Potentiell stor order.',
      'Ny kund 2024. Mycket professionella.',
      'Föredrar e-postkontakt. Bra långsiktig relation.',
      'Innovativt företag. Stor potential för framtida samarbeten.',
      'Regelbunden kund. Beställer kvartalsvis.',
      'Stort multinationellt företag. Många avdelningar och kontakter.',
      'Internationellt företag med svensk avdelning. Komplexa organisationsstrukturer.',
      'Strategisk partner. Viktigt att underhålla relationen.'
    ][Math.floor(Math.random() * 10)],
    companyType: ['Kund', 'Leverantör', 'ÅF', 'Prospect'][Math.floor(Math.random() * 4)]
  });
}

// Generate contacts with multiple contacts per company
const contacts = [];
let contactId = 1;

// Some companies will have multiple contacts
const companiesWithMultipleContacts = [1, 6, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50]; // Company IDs with multiple contacts

const titles = [
  'VD', 'IT-chef', 'Teknisk chef', 'Projektledare', 'Säljchef', 'Marknadschef', 'HR-chef', 
  'Ekonomichef', 'Driftchef', 'Utvecklingschef', 'Produktchef', 'Kvalitetschef',
  'Inköpschef', 'Säljare', 'Utvecklare', 'Projektkoordinator', 'Supportchef', 'Servicechef'
];

const departments = [
  'IT', 'Teknik', 'Försäljning', 'Marknadsföring', 'HR', 'Ekonomi', 'Drift', 'Utveckling',
  'Produktion', 'Kvalitet', 'Inköp', 'Support', 'Service', 'Administration', 'Ledning'
];

for (let i = 1; i <= 50; i++) {
  const customer = customers[i-1];
  const isMultipleContactCompany = companiesWithMultipleContacts.includes(i);
  const contactCount = isMultipleContactCompany ? Math.floor(Math.random() * 4) + 2 : 1; // 2-5 contacts for selected companies, 1 for others
  
  for (let j = 0; j < contactCount; j++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const isMainContact = j === 0; // First contact is main contact
    
    contacts.push({
      id: contactId++,
      name: `${firstName} ${lastName}`,
      phone: `070-${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 90) + 10)} ${String(Math.floor(Math.random() * 90) + 10)}`,
      company: customer.companyName,
      status: customer.status,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${customer.companyName.toLowerCase().replace(/[^a-z]/g, '')}.se`,
      isMainContact: isMainContact
    });
  }
}

// Write files
fs.writeFileSync('src/storages/customers-move-to-backend.json', JSON.stringify(customers, null, 2));
fs.writeFileSync('src/storages/contacts.json', JSON.stringify(contacts, null, 2));

console.log(`Generated ${customers.length} customers and ${contacts.length} contacts`);
console.log(`Companies with multiple contacts: ${companiesWithMultipleContacts.length}`);
console.log(`Average contacts per company: ${(contacts.length / customers.length).toFixed(1)}`); 