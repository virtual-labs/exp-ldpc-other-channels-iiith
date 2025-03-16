// select a random H matrix

const rows = Math.floor(Math.random() * 3) + 3;
const cols = Math.floor(Math.random() * 3) + rows + 1;
const rate = Math.random() * 0.5 + 0.25;

// Add tracking variables
let currentRound = 0;

const predefinedParityCheckMatrices = [
    {
        H: [
            [1, 1, 0, 1, 1, 0, 0],
            [1, 0, 1, 0, 0, 1, 0],
            [0, 1, 1, 1, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
    {
        H: [
            [1, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 0, 1, 0],
            [1, 1, 0, 0, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
    {
        H: [
            [0, 1, 1, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0],
            [1, 1, 0, 0, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
    {
        H: [
            [1, 0, 0, 1, 1, 0, 0],
            [0, 1, 0, 1, 0, 1, 0],
            [1, 1, 1, 0, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
];



const GH = generateLDPCMatrices();
const G = GH.generatorMatrix;
const H = GH.parityCheckMatrix;

console.log("H matrix:", H);
console.log("G matrix:", G);


// Function to compute the generator matrix from a given parity check matrix
function getGeneratorMatrix(H, k, n) {
    const rows = H.length;
    const cols = H[0].length;

    // Verify the input matrix is systematic
    const PTranspose = H.map(row => row.slice(0, k));
    const identity = H.map(row => row.slice(k));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < rows; j++) {
            if (identity[i][j] !== (i === j ? 1 : 0)) {
                throw new Error("Input parity check matrix is not in systematic form.");
            }
        }
    }

    // Transpose PTranspose to get P
    const P = Array.from({ length: k }, (_, i) =>
        Array.from({ length: rows }, (_, j) => PTranspose[j][i])
    );

    // Construct G = [I_k | P]
    const identityK = Array.from({ length: k }, (_, i) =>
        Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))
    );
    return identityK.map((row, i) => [...row, ...P[i]]);
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
    value: '0',
    label: `z${i}: ?` // Combined ID and value label
}));

let nodes = [...bitNodes, ...checkNodes];


// Create links (edges) between bits and checks based on H matrix
let links = [];
H.forEach((row, i) => {
    row.forEach((val, j) => {
        if (val === 1) {
            links.push({ 
                source: "x" + j, 
                target: "z" + i,
                isDotted: bitNodes[j].value !== '?' // Add property to track if link should be dotted
            });
        }
    });
});

// Add the links to the SVG with conditional styling
let link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "#999")
    .style("stroke-dasharray", d => d.isDotted ? "5,5" : "none"); // Apply dotted style conditionally

// The rest of your node and label creation code remains the same...

// Update the updateLinks function to maintain the dotted styling
function updateLinks() {
    link
        .attr("x1", d => bitNodes.find(n => n.id === d.source).x)
        .attr("y1", d => bitNodes.find(n => n.id === d.source).y)
        .attr("x2", d => checkNodes.find(n => n.id === d.target).x)
        .attr("y2", d => checkNodes.find(n => n.id === d.target).y)
        .style("stroke-dasharray", d => d.isDotted ? "5,5" : "none"); // Maintain dotted style during updates
}

// Add function to update link styles if bit values change
function updateLinkStyles() {
    links.forEach(link => {
        const sourceNode = bitNodes.find(n => n.id === link.source);
        link.isDotted = sourceNode.value !== '?';
    });
    
    link.style("stroke-dasharray", d => d.isDotted ? "5,5" : "none");
}

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
    checkNodes.forEach((checkNode, i) => {
        let knownValues = [];
        H[i].forEach((val, j) => {
            if (val === 1 && !bitNodes[j].peeled && bitNodes[j].value !== '?') {
                knownValues.push(bitNodes[j].value);
            }
        });
        
        if (knownValues.length > 0) {
            let sum = knownValues.reduce((a, b) => a ^ b, 0);
            checkNode.value = sum;
            checkNode.label = `z${i}: ${sum}`;
        } else {
            checkNode.value = '?';
            checkNode.label = `z${i}: ?`;
        }
        
        // Update the label in the DOM
        const labelElement = svg.select(`foreignObject#${checkNode.id}`)
            .select("div");
        
        if (labelElement.node()) {
            labelElement.html(() => {
                return `\\(z_{${checkNode.id.slice(1)}}: ${checkNode.value}\\)`;
            });
            
            // If you're using MathJax, retypeset
            if (typeof MathJax !== 'undefined') {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            }
        }
    });
// Trigger MathJax rendering
// MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

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


// Call the function to add options to the form
// addOptionsToForm();

// Initial call to update links based on static positions
updateLinks();
adjustSVGSize();

function insertUnderscore(str) {
    return str[0] + '_' + str.slice(1);
}


// Initialize the graph with first round options

function updateGraphForRound(peeledNodes) {
    // Update visual representation for all peeled nodes
    peeledNodes.forEach(node => {
        const nodeElement = svg.select(`[id='${node.id}']`);
        nodeElement
        .transition()
        .duration(500)
        .attr("fill", "#ff6b6b")
        .attr("opacity", 0.6);
        
        // Update all connected links
        const affectedLinks = links.filter(link =>
            link.source === node.id || link.target === node.id
        );
        
        affectedLinks.forEach(link => {
            svg.selectAll("line")
            .filter(l => l.source === link.source && l.target === link.target)
            .transition()
            .duration(500)
            .attr("stroke", "#ddd")
            .attr("opacity", 0.3);
        });
        
        // Update labels
        svg.select(`text#label-${node.id}`)
        .text(`${node.id} (Peeled)`);
    });
    
    // Update links data structure
    links = links.filter(link =>
        !peeledNodes.some(node =>
            link.source === node.id || link.target === node.id
        )
    );
}

// Function to get valid messages for current round
function getInitialMessages() {
    let messages = [];
    
    // Find check nodes with exactly one erased bit node connection
    let foundMessage = false;
    
    checkNodes.forEach(checkNode => {
        if (checkNode.peeled) return;
        
        // Find connected bit nodes
        let connectedBitNodes = links
        .filter(link => link.target === checkNode.id)
        .map(link => bitNodes.find(n => n.id === link.source));
        
        // Filter out peeled bit nodes
        let unpeeledBitNodes = connectedBitNodes.filter(node => !node.peeled);
        
        // Find erased bit nodes (value === '?')
        let erasedBitNodes = unpeeledBitNodes.filter(node => node.value === '?');
        console.log(erasedBitNodes)

        if (erasedBitNodes.length === 1) {
            foundMessage = true;
            let erasedNode = erasedBitNodes[0];
            
            // Compute message: sum of all other connected bit nodes modulo 2
            let sum = 0;
            unpeeledBitNodes.forEach(node => {
                if (node.value !== '?' && node !== erasedNode) {
                    sum ^= node.value;
                }
            });

            console.log(erasedNode.id)
            
            messages.push({
                from: checkNode.id,
                to: erasedNode.id,
                message: `\\(\\mu_{${insertUnderscore(checkNode.id)}\\to ${insertUnderscore(erasedNode.id)}} = ${sum}\\)`
            });
        }
    });
    
    if (foundMessage) {
        return {
            found: true,
            messages: messages
        };
    }
    return {
        found: false,
        messages: []
    };
}

generateMessageOptions(getInitialMessages());
function generateMessageOptions(correctMessages) {
    // Get the form element
    const form = document.getElementById('form1');
    form.innerHTML = '';

    const options = [];
    
    console.log(correctMessages)

    // Option 1: Correct messages
    if (correctMessages.found) {
        options.push({
            id: 'correct',
            messages: correctMessages.messages,
            label: 'Messages passing in this round:'
        });
    } else {
        options.push({
            id: 'process-over',
            messages: [{ message: "No message will be sent. The process is over." }],
            label: 'Messages passing in this round:'
        });
    }

    // Option 2: Wrong direction messages
    const wrongDirectionMessages = [];
    if (currentDirection === 'left-to-right') {
        bitNodes.forEach(node => {
            if (!node.peeled && node.value === '?') {
                const connections = links.filter(link =>
                    link.source === node.id &&
                    !checkNodes.find(n => n.id === link.target).peeled
                );
                if (connections.length === 1) {
                    const checkNodeId = connections[0].target;
                    wrongDirectionMessages.push({
                        from: node.id,
                        to: checkNodeId,
                        message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(checkNodeId)}} = ${Math.random() < 0.5 ? 0 : 1}\\)`
                    });
                }
            }
        });
    }
    ensureNonEmpty(wrongDirectionMessages);
    options.push({
        id: 'wrong-direction',
        messages: wrongDirectionMessages,
        label: 'Messages passing in this round:'
    });

    // Option 3: Invalid degree messages
    let invalidDegreeMessages = [];
    checkNodes.forEach(node => {
        if (!node.peeled) {
            const connections = links.filter(link =>
                link.target === node.id &&
                !bitNodes.find(n => n.id === link.source).peeled
            );
            if (connections.length > 1) {
                const bitNodeId = connections[0].source;
                invalidDegreeMessages.push({
                    from: node.id,
                    to: bitNodeId,
                    message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(bitNodeId)}} = ${Math.random() < 0.5 ? 0 : 1}\\)`
                });
            }
        }
    });

    if (invalidDegreeMessages.length === 0) {
        invalidDegreeMessages = generateInvalidMessages(2);
    }
    options.push({
        id: 'invalid-degree',
        messages: invalidDegreeMessages,
        label: 'Messages passing in this round:'
    });

    // Option 4: Process over or unconnected node messages
    if (!correctMessages.found) {
        const invalidMessages = generateInvalidMessages(2);
        ensureNonEmpty(invalidMessages);
        options.push({
            id: 'invalid',
            messages: invalidMessages,
            label: 'Messages passing in this round:'
        });
    } else {
        options.push({
            id: 'process-over',
            messages: [{ message: "No message will be sent. The process is over." }],
            label: 'Messages passing in this round:'
        });
    }

    // Shuffle and display options
    const shuffledOptions = shuffleArray(options);
    shuffledOptions.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.style.paddingTop = '0.4em'


        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'message-set';
        radio.id = option.id;
        radio.value = index;

        const label = document.createElement('label');
        label.htmlFor = option.id;

        // Create separate spans for label and messages with styling
        const labelSpan = document.createElement('span');
        labelSpan.textContent = option.label;
        // labelSpan.style.display = 'block';
        // labelSpan.style.marginBottom = '12px';  // Adjust this value to control spacing
        
        const messagesSpan = document.createElement('span');
        messagesSpan.style.display = 'block'
        // messagesSpan.style.paddingTop = '0.4em'
        messagesSpan.innerHTML = option.messages.map(msg => msg.message || msg).join(', ');

        label.appendChild(labelSpan);
        label.appendChild(messagesSpan)

        div.appendChild(radio);
        div.appendChild(label);
        form.appendChild(div);
    });
}

// Function to generate invalid messages between unconnected nodes
function generateInvalidMessages(count) {
    const invalidMessages = [];
    const bitNodesUnconnected = bitNodes.filter(bitNode => 
        !links.some(link => link.source === bitNode.id || link.target === bitNode.id)
    );
    const checkNodesUnconnected = checkNodes.filter(checkNode => 
        !links.some(link => link.source === checkNode.id || link.target === checkNode.id)
    );

    while (invalidMessages.length < count) {
        let bitNode, checkNode;
        
        if (bitNodesUnconnected.length > 0 && checkNodesUnconnected.length > 0) {
            bitNode = bitNodesUnconnected[Math.floor(Math.random() * bitNodesUnconnected.length)];
            checkNode = checkNodesUnconnected[Math.floor(Math.random() * checkNodesUnconnected.length)];
        } else {
            // Fallback: Pick any two random nodes (not necessarily unconnected)
            bitNode = bitNodes[Math.floor(Math.random() * bitNodes.length)];
            checkNode = checkNodes[Math.floor(Math.random() * checkNodes.length)];
        }

        invalidMessages.push({
            from: bitNode.id,
            to: checkNode.id,
            message: `\\(\\mu_{${insertUnderscore(bitNode.id)}\\to ${insertUnderscore(checkNode.id)}} = ${Math.random() < 0.5 ? 0 : 1}\\)`
        });

        // Remove selected nodes to avoid duplicates
        bitNodesUnconnected.splice(bitNodesUnconnected.indexOf(bitNode), 1);
        checkNodesUnconnected.splice(checkNodesUnconnected.indexOf(checkNode), 1);
    }

    return invalidMessages;
}

// Function to ensure message array is not empty
function ensureNonEmpty(messages) {
    if (messages.length === 0) {
        messages.push(generateInvalidMessages(1)[0]);
    }
}

// Modify NextRound() to use getCurrentRoundMessages
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
    if (selectedOption.id === 'correct') {
        observation.innerHTML = "Correct! Now, let's attempt a full decoding.";
        observation.style.color = "green";
    } else if(observation.innerHTML === "Incorrect! Consider what are the \"meaningful\" messages that can be passed in this round."){
        observation.innerHTML = "Still incorrect! Please review the theory once again.";
        observation.style.color = "red";
    } else{
        observation.innerHTML = "Incorrect! Consider what are the \"meaningful\" messages that can be passed in this round.";
        observation.style.color = "red";
    }
    
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



// Helper function to count current node degrees
function getNodeDegrees(nodeId) {
    return links.filter(link =>
        (link.source === nodeId || link.target === nodeId) &&
        !bitNodes.find(n => n.id === link.source).peeled &&
        !checkNodes.find(n => n.id === link.target).peeled
    ).length;
}

// Call this function to start the iterative peeling process
// nextRound();

