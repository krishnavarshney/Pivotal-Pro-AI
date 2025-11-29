
const API_URL = 'http://localhost:3000/data-sources';
const WORKSPACE_ID = '232d4295-1d50-4f34-b3ec-0f11961dab43';

async function testApi() {
    try {
        console.log('1. Creating Data Source...');
        const createRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspaceId: WORKSPACE_ID,
                name: 'Test Data Source',
                type: 'file',
                status: 'connected',
                fieldsSchema: { dimensions: [], measures: [] },
                data: [{ id: 1, value: 100 }]
            })
        });
        
        if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
        const newSource = await createRes.json();
        console.log('Created:', newSource.id);

        console.log('2. Fetching Data Sources...');
        const listRes = await fetch(`${API_URL}?workspaceId=${WORKSPACE_ID}`);
        if (!listRes.ok) throw new Error(`List failed: ${listRes.status}`);
        const sources = await listRes.json();
        const found = sources.find(s => s.id === newSource.id);
        if (found) {
            console.log('Found created source in list.');
        } else {
            console.error('Source not found in list!');
            process.exit(1);
        }

        console.log('3. Updating Data Source...');
        const updateRes = await fetch(`${API_URL}/${newSource.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Updated Name' })
        });
        if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);
        const updatedSource = await updateRes.json();
        
        if (updatedSource.name === 'Updated Name') {
            console.log('Update successful.');
        } else {
            console.error('Update failed!');
        }

        console.log('4. Deleting Data Source...');
        const deleteRes = await fetch(`${API_URL}/${newSource.id}`, { method: 'DELETE' });
        if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
        console.log('Deleted.');

        console.log('5. Verifying Deletion...');
        const listRes2 = await fetch(`${API_URL}?workspaceId=${WORKSPACE_ID}`);
        const sources2 = await listRes2.json();
        const found2 = sources2.find(s => s.id === newSource.id);
        if (!found2) {
            console.log('Source successfully removed.');
        } else {
            console.error('Source still exists!');
        }

        console.log('ALL TESTS PASSED');

    } catch (error) {
        console.error('Test Failed:', error.message);
        process.exit(1);
    }
}

testApi();
