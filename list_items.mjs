import fetch from 'node-fetch';

async function listItems() {
    try {
        const response = await fetch('http://localhost:5000/api/menu/items');
        const items = await response.json();
        const simplified = items.map(i => ({
            id: i._id,
            name: i.name,
            image: i.image
        }));
        console.log(JSON.stringify(simplified, null, 2));
    } catch (err) {
        console.error(err);
    }
}

listItems();
