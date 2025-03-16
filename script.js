const encounterDisposition = {
    "1-3": "Friendly",
    "4-6": "Neutral",
    "7-9": "Suspicious",
    "10-12": "Hostile"
};

function getDisposition(roll) {
    if (roll <= 3) return encounterDisposition["1-3"];
    if (roll <= 6) return encounterDisposition["4-6"];
    if (roll <= 9) return encounterDisposition["7-9"];
    return encounterDisposition["10-12"];
}

const parseRange = (rangeStr) => {
    // Normalize different types of dashes to simple hyphen
    rangeStr = rangeStr.replace(/–/g, '-');

    // Handle single number case ("00" or "01")
    if (!rangeStr.includes('-')) {
        const num = rangeStr === "00" ? 100 : parseInt(rangeStr);
        return [num, num];
    }
    
    // Handle range case ("01-05" or "96-00")
    const [start, end] = rangeStr.split('-').map(str => {
        if (str === "00") return 100;
        return parseInt(str);
    });
    return [start, end];
};

const findEncounter = (encounterTable, roll) => {
    // Loop through each entry in the table to find the matching range
    for (const entry of encounterTable) {
        const [min, max] = parseRange(entry.range);
        if (roll >= min && roll <= max) {
            return entry;
        }
    }
    return null; // Return null if no matching range is found
};

// Function to extract level ranges for a specific terrain
function getLevelRangesForTerrain(tables, terrain) {
    const ranges = [];
    const prefix = `${terrain} Encounters (Levels `;
    
    // Look through all table names to find matching terrain with different level ranges
    for (const tableName of Object.keys(tables)) {
        if (tableName.startsWith(prefix)) {
            // Extract the level range from the table name
            const levelRange = tableName.substring(prefix.length, tableName.length - 1);
            ranges.push(levelRange);
        }
    }
    
    return ranges;
}

// Function to update the level dropdown based on selected terrain
async function updateLevelRanges() {
    try {
        const response = await fetch('encounter-table.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch encounter tables: ${response.statusText}`);
        }
        
        const tables = await response.json();
        const terrain = document.getElementById('terrain').value;
        const levelSelect = document.getElementById('level');
        
        // Clear current options
        levelSelect.innerHTML = '';
        
        // Get level ranges for selected terrain
        const levelRanges = getLevelRangesForTerrain(tables, terrain);
        
        // Add options for each level range
        levelRanges.forEach(range => {
            const option = document.createElement('option');
            option.value = range;
            option.textContent = range;
            levelSelect.appendChild(option);
        });
        
        console.log(`Updated level ranges for ${terrain}: ${levelRanges.join(', ')}`);
    } catch (error) {
        console.error('Error updating level ranges:', error);
    }
}

async function generateEncounter() {
    try {
        const response = await fetch('encounter-table.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch encounter tables: ${response.statusText}`);
        }
        
        const tables = await response.json();
        
        const terrain = document.getElementById('terrain').value;
        const levelRange = document.getElementById('level').value;
        
        // Construct the table name using the selected level range
        let tableName = `${terrain} Encounters (Levels ${levelRange})`;
        
        console.log(`Looking for table: "${tableName}"`);
        
        // Try to find the table directly
        let encounterTable = tables[tableName];
        
        // If not found, try normalizing dashes in tableName and keys
        if (!encounterTable) {
            console.log("Table not found, trying to normalize dashes");
            const normalizedTableName = tableName.replace(/-/g, '–'); // Replace hyphens with en-dashes
            encounterTable = tables[normalizedTableName];
            
            if (!encounterTable) {
                // If still not found, try to find a key that matches after normalization
                for (const key of Object.keys(tables)) {
                    const normalizedKey = key.replace(/–/g, '-'); // Replace en-dashes with hyphens
                    if (normalizedKey === tableName) {
                        encounterTable = tables[key];
                        break;
                    }
                }
            }
        }
        
        if (!encounterTable) {
            // Log available table names to help with debugging
            console.error('Available tables:', Object.keys(tables));
            throw new Error(`Encounter table not found: ${tableName}`);
        }

        // Generate 5 sets of encounters
        let resultsHTML = '';
        
        for (let set = 1; set <= 5; set++) {
            const roll1 = Math.floor(Math.random() * 100) + 1;
            const roll2 = Math.floor(Math.random() * 100) + 1;
            const disposition1 = Math.floor(Math.random() * 12) + 1;
            const disposition2 = Math.floor(Math.random() * 12) + 1;
            
            console.log(`Set ${set} - Roll 1: ${roll1}, Roll 2: ${roll2}`);
            
            const encounter1 = findEncounter(encounterTable, roll1);
            const encounter2 = findEncounter(encounterTable, roll2);

            if (!encounter1 || !encounter2) {
                console.error(`Set ${set} - Roll 1:`, roll1, 'Result:', encounter1);
                console.error(`Set ${set} - Roll 2:`, roll2, 'Result:', encounter2);
                throw new Error(`Failed to find encounters for rolls: ${roll1}, ${roll2}`);
            }

            resultsHTML += `
                <div class="encounter-set">
                    <h3>Encounter Set ${set}</h3>
                    <div class="encounter">
                        <strong>Roll 1: ${roll1}</strong><br>
                        <strong>Range: ${encounter1.range}</strong><br>
                        <strong>Disposition (${disposition1}): ${getDisposition(disposition1)}</strong><br>
                        ${encounter1.encounter}
                    </div>
                    <div class="encounter">
                        <strong>Roll 2: ${roll2}</strong><br>
                        <strong>Range: ${encounter2.range}</strong><br>
                        <strong>Disposition (${disposition2}): ${getDisposition(disposition2)}</strong><br>
                        ${encounter2.encounter}
                    </div>
                </div>
                ${set < 5 ? '<hr>' : ''}
            `;
        }

        document.getElementById('result').innerHTML = resultsHTML;

    } catch (error) {
        console.error('Error generating encounter:', error);
        document.getElementById('result').innerHTML = `Error: ${error.message}`;
    }
}

// Add event listeners once DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Attach the function to the button click event
    const generateButton = document.getElementById('generate');
    if (generateButton) {
        generateButton.addEventListener('click', generateEncounter);
    } else {
        console.error("Generate button not found in the document");
    }
    
    // Add terrain change event listener to update level ranges
    const terrainSelect = document.getElementById('terrain');
    if (terrainSelect) {
        // Initialize level ranges for default terrain
        updateLevelRanges();
        
        // Update level ranges when terrain changes
        terrainSelect.addEventListener('change', updateLevelRanges);
    } else {
        console.error("Terrain select not found in the document");
    }
});
