const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function checkProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/flour-mill');
        console.log('Connected to database\n');

        const products = await Product.find({}).select('name category status').limit(50);

        console.log(`Found ${products.length} products:\n`);
        products.forEach((p, index) => {
            console.log(`${index + 1}. Name: "${p.name}" | Category: "${p.category}" | Status: ${p.status}`);
        });

        console.log('\n--- Filtering for Wheat ---');
        const wheatProducts = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const category = (p.category || '').toLowerCase();

            if (name.includes('ata')) {
                console.log(`❌ Excluded: ${p.name} (contains 'ata')`);
                return false;
            }

            const isWheat = name.includes('wheat') || name.includes('grain');
            if (isWheat) {
                console.log(`✅ Included: ${p.name}`);
            }
            return isWheat;
        });

        console.log(`\n✅ Total wheat products found: ${wheatProducts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProducts();
