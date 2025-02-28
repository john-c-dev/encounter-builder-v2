
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
    return encounterTable.find(entry => {
        const [min, max] = parseRange(entry.range);
        return roll >= min && roll <= max;
    });
};

async function generateEncounter() {
    try {
        const response = await fetch('encounter-table.json');
        const tables = await response.json();

        const terrain = document.getElementById('terrain').value;
        const level = parseInt(document.getElementById('level').value);
        
        // Find the correct level range for the table name
        let levelRange;
        if (level >= 1 && level <= 4) levelRange = "1–4";
        else if (level >= 5 && level <= 10) levelRange = "5–10";
        else if (level >= 11 && level <= 16) levelRange = "11–16";
        else if (level >= 17 && level <= 20) levelRange = "17–20";
        else throw new Error('Invalid level range');

        const tableName = `${terrain} Encounters (Levels ${levelRange})`;
        
        const encounterTable = tables[tableName];
        if (!encounterTable) {
            throw new Error(`Encounter table not found: ${tableName}`);
        }

        const roll1 = Math.floor(Math.random() * 100) + 1;
        const roll2 = Math.floor(Math.random() * 100) + 1;
        const disposition1 = Math.floor(Math.random() * 12) + 1;
        const disposition2 = Math.floor(Math.random() * 12) + 1;
        
        const encounter1 = findEncounter(encounterTable, roll1);
        const encounter2 = findEncounter(encounterTable, roll2);

        if (!encounter1 || !encounter2) {
            throw new Error(`Failed to find encounters for rolls: ${roll1}, ${roll2}`);
        }

        document.getElementById('result').innerHTML = `
            <div class="encounter">
                <strong>Roll 1: ${roll1}</strong><br>
                <strong>Range: ${encounter1.range}</strong><br>
                <strong>Disposition (${disposition1}): ${getDisposition(disposition1)}</strong><br>
                ${encounter1.encounter}
            </div>
            <hr>
            <div class="encounter">
                <strong>Roll 2: ${roll2}</strong><br>
                <strong>Range: ${encounter2.range}</strong><br>
                <strong>Disposition (${disposition2}): ${getDisposition(disposition2)}</strong><br>
                ${encounter2.encounter}
            </div>
        `;

    } catch (error) {
        console.error('Error details:', error);
        document.getElementById('result').innerHTML = `Error: ${error.message}`;
    }
}
