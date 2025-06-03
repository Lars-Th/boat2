# MoxMaster Storage System - Komplett Guide
 
## 🎯 Snabbstart för nya utvecklare/AI-assistenter
 
**VIKTIGT**: Detta dokument innehåller allt du behöver veta för att arbeta med MoxMaster Storage-systemet. Läs detta först innan du gör ändringar!
 
### Grundläggande koncept
- **Storage-katalog**: `src/Storage/` (INTE `src/stores/`)
- **Namnkonvention**: `[Entity]Storage.ts` (t.ex. `CustomerStorage.ts`)
- **Funktioner**: `use[Entity]Storage()` (t.ex. `useCustomerStorage()`)
- **JSON-data**: Varje Storage har motsvarande JSON-fil(er) för dummy-data
 
## 📁 Aktuell Storage-struktur (2024)
 
### Befintliga Storage-moduler:
 
| Storage | JSON-filer | Status | Beskrivning |
|---------|------------|--------|-------------|
| `CustomerStorage.ts` | `customers.json` | ✅ Fungerande | Kundhantering (~600 kunder) |
| `ContactStorage.ts` | `contacts.json` | ✅ Fungerande | Kontaktpersonhantering (allmänna + kundkopplade) |
| `UserStorage.ts` | `users.json`, `roles.json`, `permissions.json` | ✅ Fungerande | Användarhantering med roller |
| `WorkOrderStorage.ts` | Ingen JSON | ✅ Fungerande | Arbetsorderhantering (hardkodad data) |
| `PlanningStorage.ts` | Ingen JSON | ✅ Fungerande | Planeringshantering (hardkodad data) |
| `DashboardStorage.ts` | `dashboard.json` | ✅ Fungerande | Dashboard-konfiguration |
| `ProspectorStorage.ts` | Ingen JSON | ✅ Fungerande | API-baserad prospektering |
 
## 🔧 Så här fungerar Storage-systemet
 
### 1. Grundläggande Storage-struktur
 
**Exempel: CustomerStorage.ts**
```typescript
import { defineStore } from 'pinia'
import customersData from './customers.json'  // VIKTIGT: Importera JSON-data
 
export interface Customer {
  id: number
  name: string
  city: string
  phone: string
  companyName: string
  status: 'Aktiv' | 'Inaktiv'
  email: string
  // ... fler fält
}
 
export const useCustomerStorage = defineStore('customer', {
  state: () => ({
    customers: customersData as Customer[]  // VIKTIGT: Type casting
  }),
  getters: {
    activeCustomers: (state) => state.customers.filter(c => c.status === 'Aktiv'),
    getCustomerById: (state) => (id: number) => state.customers.find(c => c.id === id),
    totalCustomers: (state) => state.customers.length,
  },
  actions: {
    addCustomer(customer: Omit<Customer, 'id'>) {
      this.customers.push({ ...customer, id: Date.now() })
    },
    updateCustomer(updated: Customer) {
      const index = this.customers.findIndex(c => c.id === updated.id)
      if (index !== -1) {
        this.customers[index] = updated
      }
    },
    removeCustomer(id: number) {
      this.customers = this.customers.filter(c => c.id !== id)
    }
  }
})
```
 
### 2. Användning i Vue-komponenter
 
```typescript
<script setup lang="ts">
import { useCustomerStorage } from '@/Storage/CustomerStorage'
import { useContactStorage } from '@/Storage/ContactStorage'
 
// Initiera storage
const customerStorage = useCustomerStorage()
const contactStorage = useContactStorage()
 
// Hämta data
const customers = customerStorage.customers
const activeCustomers = customerStorage.activeCustomers
 
// Hämta specifik kund
const customer = customerStorage.getCustomerById(1)
 
// Hämta kontakter för en kund
const customerContacts = contactStorage.getContactsByCustomerId(1)
 
// Lägg till ny kund
const addNewCustomer = () => {
  customerStorage.addCustomer({
    name: "Ny Kund",
    city: "Stockholm",
    phone: "070-123 45 67",
    companyName: "Nytt Företag AB",
    status: "Aktiv",
    email: "info@nyttforetag.se",
    // ... alla andra obligatoriska fält
  })
}
</script>
```
 
## 🔗 Kontakt-Kund kopplingar (Viktigt exempel)
 
### ContactStorage - Unified System
 
ContactStorage hanterar BÅDE allmänna kontakter OCH kundkopplade kontakter:
 
```typescript
export interface Contact {
  id: number
  name: string
  city: string
  phone: string
  company: string
  status: 'Aktiv' | 'Inaktiv'
  email: string
  isMainContact: boolean
  title?: string           // Jobbtitel
  department?: string      // Avdelning
  customerId?: number | null // null = allmän kontakt, number = kopplad till kund
}
```
 
### Praktiska exempel på kontakt-hantering:
 
```typescript
// Hämta alla kontakter för kund ID 1
const customerContacts = contactStorage.getContactsByCustomerId(1)
 
// Hämta huvudkontakt för kund ID 1
const mainContact = contactStorage.getMainContactByCustomerId(1)
 
// Hämta allmänna kontakter (ej kopplade till kunder)
const generalContacts = contactStorage.generalContacts
 
// Hämta alla kundkopplade kontakter
const customerLinkedContacts = contactStorage.customerContacts
 
// Lägg till ny kontakt kopplad till kund
contactStorage.addContact({
  name: "Ny Kontakt",
  city: "Stockholm",
  phone: "070-123 45 67",
  company: "Tech Solutions AB",
  status: "Aktiv",
  email: "ny.kontakt@techsolutions.se",
  isMainContact: false,
  title: "Projektledare",
  department: "IT",
  customerId: 1  // Kopplad till kund ID 1
})
 
// Lägg till allmän kontakt (ej kopplad till kund)
contactStorage.addContact({
  name: "Allmän Kontakt",
  city: "Göteborg",
  phone: "070-987 65 43",
  company: "Fristående Företag",
  status: "Aktiv",
  email: "kontakt@fristaende.se",
  isMainContact: true,
  title: "VD",
  department: "Ledning",
  customerId: null  // null = allmän kontakt
})
```
 
## 📋 Steg-för-steg: Skapa ny Storage
 
### Steg 1: Skapa JSON-fil med dummy-data
 
**Exempel: `src/Storage/products.json`**
```json
[
  {
    "id": 1,
    "name": "Produkt A",
    "price": 299.99,
    "category": "Elektronik",
    "status": "Aktiv",
    "description": "En fantastisk produkt",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Produkt B",
    "price": 199.99,
    "category": "Kläder",
    "status": "Inaktiv",
    "description": "En annan produkt",
    "createdAt": "2024-01-02T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
]
```
 
### Steg 2: Definiera TypeScript Interface
 
```typescript
export interface Product {
  id: number
  name: string
  price: number
  category: string
  status: 'Aktiv' | 'Inaktiv'
  description: string
  createdAt: string
  updatedAt: string
}
```
 
### Steg 3: Skapa Storage-fil
 
**`src/Storage/ProductStorage.ts`**
```typescript
import { defineStore } from 'pinia'
import productsData from './products.json'
 
export interface Product {
  id: number
  name: string
  price: number
  category: string
  status: 'Aktiv' | 'Inaktiv'
  description: string
  createdAt: string
  updatedAt: string
}
 
export const useProductStorage = defineStore('product', {
  state: () => ({
    products: productsData as Product[]
  }),
  getters: {
    activeProducts: (state) => state.products.filter(p => p.status === 'Aktiv'),
    inactiveProducts: (state) => state.products.filter(p => p.status === 'Inaktiv'),
    getProductById: (state) => (id: number) => state.products.find(p => p.id === id),
    getProductsByCategory: (state) => (category: string) =>
      state.products.filter(p => p.category === category),
    totalProducts: (state) => state.products.length,
    averagePrice: (state) => {
      const activeProducts = state.products.filter(p => p.status === 'Aktiv')
      return activeProducts.length > 0
        ? activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length
        : 0
    }
  },
  actions: {
    addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      this.products.push({
        ...product,
        id: Math.max(...this.products.map(p => p.id), 0) + 1,
        createdAt: now,
        updatedAt: now
      })
    },
    updateProduct(updated: Product) {
      const index = this.products.findIndex(p => p.id === updated.id)
      if (index !== -1) {
        this.products[index] = {
          ...updated,
          updatedAt: new Date().toISOString()
        }
      }
    },
    removeProduct(id: number) {
      this.products = this.products.filter(p => p.id !== id)
    },
    toggleProductStatus(id: number) {
      const product = this.products.find(p => p.id === id)
      if (product) {
        product.status = product.status === 'Aktiv' ? 'Inaktiv' : 'Aktiv'
        product.updatedAt = new Date().toISOString()
      }
    }
  }
})
```
 
### Steg 4: Uppdatera index.ts (om den finns)
 
**`src/Storage/index.ts`**
```typescript
export { useCustomerStorage } from './CustomerStorage'
export { useContactStorage } from './ContactStorage'
export { useUserStorage } from './UserStorage'
export { useProductStorage } from './ProductStorage'  // Lägg till ny storage
// ... andra exports
```
 
### Steg 5: Använd i komponenter
 
```typescript
<script setup lang="ts">
import { useProductStorage } from '@/Storage/ProductStorage'
 
const productStorage = useProductStorage()
 
// Hämta data
const products = productStorage.products
const activeProducts = productStorage.activeProducts
const averagePrice = productStorage.averagePrice
 
// Lägg till produkt
const addProduct = () => {
  productStorage.addProduct({
    name: "Ny Produkt",
    price: 399.99,
    category: "Elektronik",
    status: "Aktiv",
    description: "En helt ny produkt"
  })
}
</script>
```
 
## 🚨 Viktiga regler och fallgropar
 
### ✅ GÖR:
1. **Skapa JSON-fil FÖRST** - Alltid skapa JSON-filen innan Storage-filen
2. **Använd type casting** - `jsonData as TypeName[]`
3. **Följ namnkonventionen** - `[Entity]Storage.ts` och `use[Entity]Storage()`
4. **Importera från @/Storage/** - INTE från `@/stores/`
5. **Använd actions för ändringar** - Aldrig direkt mutation av state
6. **Validera data** - Kontrollera att alla obligatoriska fält finns
 
### ❌ GÖR INTE:
1. **Skapa Storage utan JSON** - Kommer orsaka import-fel
2. **Ändra JSON under körning** - Kan orsaka oväntade fel
3. **Använd gamla store-imports** - `@/stores/` är deprecated
4. **Glöm type casting** - TypeScript kommer klaga
5. **Direkt state mutation** - Använd alltid actions
6. **Duplicera ID:n** - Använd `Date.now()` eller UUID
 
## 🔄 Migration från gamla stores
 
Om du hittar gamla imports, uppdatera dem:
 
```typescript
// ❌ Gammalt (fungerar inte)
import { useCustomerStore } from '@/stores/customerStore'
import { useContactStore } from '@/stores/contactStore'
 
// ✅ Nytt (korrekt)
import { useCustomerStorage } from '@/Storage/CustomerStorage'
import { useContactStorage } from '@/Storage/ContactStorage'
```
 
## 🧪 Testning av Storage
 
### Grundläggande test i Vue-komponent:
 
```typescript
<script setup lang="ts">
import { useCustomerStorage } from '@/Storage/CustomerStorage'
import { useContactStorage } from '@/Storage/ContactStorage'
 
const customerStorage = useCustomerStorage()
const contactStorage = useContactStorage()
 
// Test 1: Kontrollera att data laddas
console.log('Antal kunder:', customerStorage.totalCustomers)
console.log('Antal kontakter:', contactStorage.totalContacts)
 
// Test 2: Kontrollera getters
console.log('Aktiva kunder:', customerStorage.activeCustomers.length)
console.log('Allmänna kontakter:', contactStorage.generalContacts.length)
 
// Test 3: Test CRUD-operationer
const testCRUD = () => {
  // Lägg till
  customerStorage.addCustomer({
    name: "Test Kund",
    city: "Stockholm",
    phone: "070-123 45 67",
    companyName: "Test AB",
    status: "Aktiv",
    email: "test@test.se",
    // ... alla andra obligatoriska fält
  })
  
  console.log('Efter tillägg:', customerStorage.totalCustomers)
}
</script>
```
 
## 📊 Aktuell dataöversikt
 
### CustomerStorage
- **Antal poster**: ~600 kunder
- **JSON-fil**: `customers.json`
- **Huvudfält**: name, city, phone, companyName, status, email, customerNumber, etc.
 
### ContactStorage  
- **Antal poster**: ~20 kontakter
- **JSON-fil**: `contacts.json` (konsoliderad från tidigare system)
- **Typer**: Allmänna kontakter (customerId: null) + Kundkopplade kontakter (customerId: number)
- **Huvudfält**: name, city, phone, company, status, email, isMainContact, title, department, customerId
 
### UserStorage
- **Antal poster**: 5 användare
- **JSON-filer**: `users.json`, `roles.json`, `permissions.json`
- **Relationer**: Users har roles, roles har permissions
 
## 🔧 Felsökning
 
### Vanliga fel och lösningar:
 
**1. "Cannot resolve import" fel**
```
Failed to resolve import "@/Storage/CustomerStorage"
```
**Lösning**: Kontrollera att filen finns och att du använder rätt sökväg
 
**2. "Cannot apply unknown utility class" fel**
```
Cannot apply unknown utility class: bg-white
```
**Lösning**: Ta bort `<style scoped>` sektioner som använder `@apply` direktiv
 
**3. JSON import fel**
```
Cannot find module './data.json'
```
**Lösning**: Skapa JSON-filen först, sedan Storage-filen
 
**4. Type casting fel**
```
Type 'unknown' is not assignable to type 'Customer[]'
```
**Lösning**: Lägg till `as Customer[]` efter JSON-importen
 
## 🎯 Checklista för nya Storage
 
När du skapar en ny Storage-modul:
 
- [ ] 1. Skapa JSON-fil med dummy-data i `src/Storage/`
- [ ] 2. Definiera TypeScript interface
- [ ] 3. Skapa Storage-fil med korrekt namnkonvention
- [ ] 4. Importera JSON-data med type casting
- [ ] 5. Implementera grundläggande getters (active, getById, total)
- [ ] 6. Implementera CRUD actions (add, update, remove)
- [ ] 7. Testa i en Vue-komponent
- [ ] 8. Verifiera att data laddas korrekt
- [ ] 9. Uppdatera `src/Storage/index.ts` om den finns
- [ ] 10. Dokumentera nya fält och relationer
 
---
 
**För frågor eller problem**: Referera till befintliga Storage-filer som exempel. Alla Storage följer samma mönster!