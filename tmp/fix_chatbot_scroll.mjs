import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

// Inject useEffect for overflow-hidden after the last hook or somewhere safe
const marker = /getCustomerProfile\(\);?\s+}\s+}, \[\]\);?/;
const effect = `
  // Prevent background scroll when chatbot is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isOpen])
`;

if (c.includes('getCustomerProfile()') && c.includes('}, [])')) {
  c = c.replace(/getCustomerProfile\(\)\s*}, \[\]\)/, `getCustomerProfile()\n  }, [])\n${effect}`);
  fs.writeFileSync(file, c, 'utf8');
  console.log('Scroll lock effect added successfully');
} else {
  console.log('Markers not found');
}
