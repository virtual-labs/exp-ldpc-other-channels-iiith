// select a random H matrix

const rows = Math.floor(Math.random() * 3) + 3;
const cols = Math.floor(Math.random() * 3) + rows + 1;
const rate = Math.random() * 0.5 + 0.25;

let currentRound = 0;

const predefinedParityCheckMatrices = [
    {
        H: [
            [1, 0, 0, 1, 1, 0],
            [1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1],
        ],
        k: 3,
        n: 6,
    },
    {
        H: [
            [1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1],
            [0, 1, 1, 1, 0, 1],
        ],
        k: 3,
        n: 6,
    },
    {
        H: [
            [1, 0, 0, 0, 1, 1],
            [0, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 0, 0],
        ],
        k: 3,
        n: 6,
    },
];

const GH = generateLDPCMatrices();
const G = GH.generatorMatrix;
const H = GH.parityCheckMatrix;

console.log("H matrix:", generateLDPCMatrices());
console.log("G matrix:", G);

// Function to compute the generator matrix from a given parity check matrix
function getGeneratorMatrix(H) {
    const rows = H.length;
    const cols = H[0].length;
    const rank = gaussianElimination(H);

    const k = cols - rank;
    const pivotColumns = new Set();
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (H[i][j] === 1) {
                pivotColumns.add(j);
                break;
            }
        }
    }

    const freeColumns = [];
    for (let j = 0; j < cols; j++) {
        if (!pivotColumns.has(j)) {
            freeColumns.push(j);
        }
    }

    let G = new Array(k).fill(0).map(() => new Array(cols).fill(0));

    for (let i = 0; i < k; i++) {
        G[i][freeColumns[i]] = 1;
        for (let j = 0; j < rank; j++) {
            let pivotCol = Array.from(pivotColumns)[j];
            G[i][pivotCol] = H[j][freeColumns[i]];
        }
    }

    return G;
}

function gaussianElimination(H) {
    let rows = H.length, cols = H[0].length;
    let rank = 0, row = 0;
    
    for (let col = 0; col < cols && row < rows; col++) {
        let pivotRow = row;
        while (pivotRow < rows && H[pivotRow][col] === 0) {
            pivotRow++;
        }
        
        if (pivotRow === rows) continue;
        
        [H[row], H[pivotRow]] = [H[pivotRow], H[row]];
        
        for (let i = row + 1; i < rows; i++) {
            if (H[i][col] === 1) {
                for (let j = 0; j < cols; j++) {
                    H[i][j] ^= H[row][j];
                }
            }
        }
        
        rank++;
        row++;
    }
    return rank;
}

// Main function to generate LDPC code matrices
function generateLDPCMatrices() {
    const randomIndex = Math.floor(Math.random() * predefinedParityCheckMatrices.length);
    const { H, k, n } = predefinedParityCheckMatrices[randomIndex];

    // Generate the generator matrix from the selected parity check matrix
    const G = getGeneratorMatrix(H, k, n);

    console.log("This works succesfully");
    // Return the generator and parity check matrices
    return {
        generatorMatrix: G,
        parityCheckMatrix: H,

    };
}

// SVG dimensions
const width = 600;
const height = 400;
const nodeRadius = 10;
const bitXShiftLabel = 100;
const checkXShiftLabel = 15;
const yLabelShift = -10;
// Add this at the beginning of your code
let currentDirection = 'left-to-right';

// Append an SVG element to the #sentCodeword element
const svg = d3.select("#tannerGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define layout variables
const bitNodeStartX = 100;
const bitNodeSpacingY = 80;
const checkNodeStartX = 500;
const checkNodeSpacingY = 100;
const verticalOffset = 50;

// Modified node generation
let message = generateRandomMessage(G.length); // Generate random message of length k
let codeword = encodeMessage(message, G); // Generate valid codeword
let receivedWord = introduceErrors(codeword); // Introduce some erasures

// Function to generate a random message vector of length k
function generateRandomMessage(k) {
    return Array.from({ length: k }, () => Math.floor(Math.random() * 2));
}

// Function to encode a message using generator matrix G
function encodeMessage(message, G) {
    // Multiply message vector by generator matrix
    const n = G[0].length;
    const codeword = new Array(n).fill(0);

    for (let j = 0; j < n; j++) {
        for (let i = 0; i < message.length; i++) {
            codeword[j] = (codeword[j] + message[i] * G[i][j]) % 2;
        }
    }

    return codeword;
}

// Function to introduce errors into codeword

function introduceErrors(codeword, errorRate = 0.3) {
    const corrupted = codeword.map(bit => {
        // Randomly flip some bits to '?' based on error rate
        return Math.random() < errorRate ? '?' : bit.toString();
    });

    // Ensure at least one error by flipping a random bit if no errors exist
    if (!corrupted.includes('?')) {
        const randomIndex = Math.floor(Math.random() * codeword.length);
        corrupted[randomIndex] = '?';
    }

    return corrupted;
}

let bitNodes = H[0].map((_, j) => ({
    id: "x" + j,
    type: "x",
    x: bitNodeStartX,
    y: j * bitNodeSpacingY + verticalOffset,
    peeled: false,
    value: receivedWord[j], // Use value from received word
    label: `x${j}: ${receivedWord[j]}` // Combined ID and value label
}));

let checkNodes = H.map((_, i) => ({
    id: "z" + i,
    type: "z",
    x: checkNodeStartX,
    y: i * checkNodeSpacingY + verticalOffset,
    peeled: false,
    value: '0', // Initially all check nodes have unknown values
    label: `z${i}: ?` // Combined ID and value label
}));

let nodes = [...bitNodes, ...checkNodes];


// Create links (edges) between bits and checks based on H matrix
let links = [];
H.forEach((row, i) => {
    row.forEach((val, j) => {
        if (val === 1) {
            links.push({ source: "x" + j, target: "z" + i });
        }
    });
});

// Add the links to the SVG
let link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "#999");

// Add the nodes to the SVG
let node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append(d => document.createElementNS("http://www.w3.org/2000/svg", d.type === "x" ? "circle" : "rect"))
    .attr("r", d => d.type === "x" ? nodeRadius : null) // Only circles get radius
    .attr("width", d => d.type === "z" ? nodeRadius * 2 : null) // Width for squares
    .attr("height", d => d.type === "z" ? nodeRadius * 2 : null) // Height for squares
    .attr("fill", d => d.type === "x" ? "blue" : "green")
    .attr("cx", d => d.type === "x" ? d.x : null)
    .attr("cy", d => d.type === "x" ? d.y : null)
    .attr("x", d => d.type === "z" ? d.x - nodeRadius : null) // Center squares
    .attr("y", d => d.type === "z" ? d.y - nodeRadius : null) // Center squares
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );


let labels = svg.append("g")
    .attr("class", "labels")
    .selectAll("foreignObject")
    .data(nodes)
    .enter()
    .append("foreignObject")
    .attr("x", d => d.type === "x" ? d.x - nodeRadius - bitXShiftLabel : d.x + nodeRadius + checkXShiftLabel)
    .attr("y", d => d.y + yLabelShift)
    .attr("id", d => d.id)
    .attr("width", 100)
    .attr("height", 30)
    .append("xhtml:div")
    .style("font-size", "15px")
    .html(d => {
        if (d.type === "x") {
            return `\\(x_{${d.id.slice(1)}}: ${d.value}\\)`;
        }
        if(d.type === "z"){
            return `\\(z_{${d.id.slice(1)}}: ${d.value}\\)`;
        }
        return d.label;
    });

// Trigger MathJax rendering
// MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

// Update the positions of the links
function updateLinks() {
    link.attr("x1", d => bitNodes.find(n => n.id === d.source).x)
        .attr("y1", d => bitNodes.find(n => n.id === d.source).y)
        .attr("x2", d => checkNodes.find(n => n.id === d.target).x)
        .attr("y2", d => checkNodes.find(n => n.id === d.target).y);
}

// Drag behavior functions
function dragstarted(event, d) {
    if (!event.active) {
        d3.select(this).raise().attr("stroke", "black");
    }
}

// Update the dragged function to maintain label positions
function dragged(event, d) {
    d.x = event.x;
    d.y = event.y;

    // Update node positions
    d3.select(this)
        .attr("cx", d.type === "x" ? d.x : null)
        .attr("cy", d.type === "x" ? d.y : null)
        .attr("x", d.type === "z" ? d.x - nodeRadius : null)
        .attr("y", d.type === "z" ? d.y - nodeRadius : null);

    // Update labels positions with the combined ID and value
    labels.filter(l => l.id === d.id)
        .attr("x", d.type === "x" ? d.x - nodeRadius - bitXShiftLabel : d.x + nodeRadius + checkXShiftLabel)
        .attr("y", d.y + yLabelShift)
        .attr("html", d.html);

    updateLinks();
}


function dragended(event, d) {
    d3.select(this).attr("stroke", null);
}

// Function to adjust SVG size to fit the updated graph
function adjustSVGSize() {
    const xValues = nodes.map(d => d.x);
    const yValues = nodes.map(d => d.y);

    const minX = Math.min(...xValues) - nodeRadius;
    const maxX = Math.max(...xValues) + nodeRadius;
    const minY = Math.min(...yValues) - nodeRadius;
    const maxY = Math.max(...yValues) + nodeRadius;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const newWidth = Math.max(graphWidth, width);
    const newHeight = Math.max(graphHeight, height);

    const offsetX = (newWidth - graphWidth) / 2;
    const offsetY = (newHeight - graphHeight) / 2;

    svg.attr("width", newWidth).attr("height", newHeight);
    svg.attr("viewBox", `${minX - offsetX} ${minY - offsetY} ${newWidth} ${newHeight}`);
}



// Other three options that are not the chosen H matrix
// const incorrectOptions = setOfH.filter(h => !arraysEqual(h, H)).slice(0, 3);

// Helper function to compare two arrays
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].length !== b[i].length) return false;
        for (let j = 0; j < a[i].length; j++) {
            if (a[i][j] !== b[i][j]) return false;
        }
    }
    return true;
}


function runPeelingDecoder(receivedWord, H) {
    let decodedWord = [...receivedWord];
    let checkNodeDegrees = Array(H.length).fill(0); // Store degrees of each check node
    let remainingErasures = true;

    // Initialize checkNodeDegrees to count the number of unknown bits in each check node
    for (let i = 0; i < H.length; i++) {
        for (let j = 0; j < decodedWord.length; j++) {
            if (H[i][j] === 1 && decodedWord[j] === '?') {
                checkNodeDegrees[i]++;
            }
        }
    }

    while (remainingErasures) {
        remainingErasures = false;

        for (let i = 0; i < H.length; i++) {
            if (checkNodeDegrees[i] === 1) {
                // Find the single unknown bit in this check node
                let unknownBitIndex = -1;
                let sum = 0;

                for (let j = 0; j < decodedWord.length; j++) {
                    if (H[i][j] === 1) {
                        if (decodedWord[j] === '?') {
                            unknownBitIndex = j;
                        } else {
                            sum = (sum + parseInt(decodedWord[j])) % 2; // Add the known bits
                        }
                    }
                }

                if (unknownBitIndex !== -1) {
                    // Resolve the unknown bit
                    decodedWord[unknownBitIndex] = (sum === 0 ? '0' : '1');
                    remainingErasures = true;

                    // Update the degrees of connected check nodes
                    for (let k = 0; k < H.length; k++) {
                        if (H[k][unknownBitIndex] === 1) {
                            checkNodeDegrees[k]--;
                        }
                    }
                }
            }
        }
    }

    // Check if any erasures remain
    let fullyDecoded = !decodedWord.includes('?');

    return {
        decodedWord,
        fullyDecoded
    };
}

// Generate random incorrect codewords
function generateIncorrectOption(length) {
    const codeword = Array(length).fill('0');
    const numErrors = Math.floor(Math.random() * 3) + 1; // 1-3 errors
    const hasErasures = Math.random() < 0.5;
    
    // Introduce random bit flips
    for (let i = 0; i < numErrors; i++) {
        const pos = Math.floor(Math.random() * length);
        if (hasErasures && Math.random() < 0.3) {
            codeword[pos] = '?';
        } else {
            codeword[pos] = (parseInt(codeword[pos]) ^ 1).toString();
        }
    }
    
    return {
        codeword,
        fullyDecoded: !hasErasures
    };
}

// // Original received word from the code
// const receivedWord = ['?', '1', '?', '0', '1', '?', '0'];

// // H matrix from the code
// const H = [
//     [1, 1, 0, 1, 1, 0, 0],
//     [1, 0, 1, 0, 0, 1, 0],
//     [0, 1, 1, 1, 0, 0, 1]
// ];

// Get correct decoded result
const correctResult = runPeelingDecoder(receivedWord, H);

const form = document.getElementById('form1');
form.innerHTML = '';

// Generate options
const options = [
    {
        codeword: correctResult.decodedWord.join(''),
        status: correctResult.fullyDecoded ? "Fully Decoded" : "Partially Decoded",
        correct: true
    },
    ...Array(3).fill(null).map(() => {
        const generatedOption = generateIncorrectOption(7).codeword.join('');
        return {
            codeword: generatedOption,
            status: generatedOption.includes('?') ? "Partially decoded" : "Fully Decoded",
            correct: false
        };
    })
];

const formattedOptions = options.map((option, index) => ({
    id: `option-${index}`,
    messages: [{
        message: `\\((${option.codeword})\\), ${option.status}`
    }],
    label: 'Decoded codeword:',
    correct: option.correct
}));

// Shuffle options
const shuffledOptions = shuffleArray(formattedOptions);

shuffledOptions.forEach((option, index) => {
    const div = document.createElement('div');
    div.className = 'option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'decoded-codeword';
    radio.id = option.id;
    radio.value = index;
    radio.correct = option.correct;

    const label = document.createElement('label');
    label.htmlFor = option.id;
    label.innerHTML = `${option.label}<br>` +
        option.messages.map(msg => msg.message).join(', ');

    div.appendChild(radio);
    div.appendChild(label);
    form.appendChild(div);
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

console.log("Original received word:", receivedWord.join(''));
console.log("\nDecoding options:");
shuffledOptions.forEach((option, index) => {
    console.log(`Decoded codeword: ${option.messages[0].message}`);
});
console.log("\nCorrect decode:", shuffledOptions.findIndex(opt => opt.correct));

function NextRound() {
    const observation = document.getElementById("tannerQuestionObservation");
    const form = document.getElementById('form1');
    const selectedOption = Array.from(form.elements).find(el => el.checked);

    if (!selectedOption) {
        observation.innerHTML = "Please select an option before proceeding.";
        observation.style.color = "red";
        return;
    }

    console.log(selectedOption);
    // Check if the selected option is correct
    if (selectedOption.correct !== true) {
        if(correctResult.fullyDecoded === false && selectedOption.status === 1){
            console.log("HERE");
            observation.innerHTML = "Is this the only possible codeword that could have been sent?";
            return;
        }
        if (observation.innerHTML == "Incorrect. Please try again. An easy way to verify your answer is that the decoded vector and the received vector should be identical in all the unerased positions.") {
            observation.innerHTML = "Still incorrect. Please review the theory once again.";
        } else {
            observation.innerHTML = "Incorrect. Please try again. An easy way to verify your answer is that the decoded vector and the received vector should be identical in all the unerased positions.";
        }
        observation.style.color = "red";
        return;
    }

    // Correct option selected - proceed with the round
    observation.innerHTML = "Correct! We can move on to more complicated channel models now.";
    observation.style.color = "green";
}
