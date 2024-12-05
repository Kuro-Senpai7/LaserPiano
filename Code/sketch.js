//By Christopher Lackey

let port;
let reader;
let receivedData = "";
let values = []; // Store the incoming values as an array
// first 7 indices (values[0] to values[6]) are digital note on/off
// last two indices (values[7], values[8]) are analog sliders
let slider1, slider2;

// ramp times are controlled by slider1
let rampUpTime = 0.8; // Attack time in seconds
let rampDownTime = 1; // Release time in seconds
let maxAmplitude = 1;

let inputList = [81, 87, 69, 82, 84, 89, 85, 73, 79, 80];

// These map to the scale in frequencyList
let frequencyList = [
  130.81, // C3
  146.83, // D3
  164.81, // E3
  174.62, // F3
  196.0, // G3
  220.0, // A3
  246.94, // B3
  261.63, // C4
  293.66, // D4
  329.63, // E4
];

let pitchBend = 1; // controlled by slider2
// range is 0.5 to 2, exponential, so 1 is in the middle

// Array to hold individual MonoSynth instances
let monoSynths = [];
let activeNotes = Array(inputList.length).fill(false);

/////////////////////////

function setup() {
  createCanvas(400, 600);

  // Serial setup
  const connectButton = createButton("Connect to Serial Port");
  connectButton.position(10, 10);
  connectButton.mousePressed(connectSerial);

  // Synth setup
  for (let i = 0; i < inputList.length; i++) {
    let synth = new p5.MonoSynth();
    synth.setADSR(rampUpTime, rampDownTime);
    monoSynths.push(synth);
  }
  slider1 = createSlider(0, 1023, 512);
  slider2 = createSlider(0, 1023, 512);
}

function draw() {
  background(220);
  textSize(16);
  fill(0);

  // Display all received Serial values
  text("Received Data:", 10, 50);
  for (let i = 0; i < values.length; i++) {
    text(`Value ${i}: ${values[i]}`, 10, 80 + i * 30);
  }

  // Key input (QWERTYUIOP) for testing
  // the Serial digital (light sensor) data will also be activating notes, but no problem to keep both
  for (let i = 0; i < inputList.length; i++) {
    if (keyIsDown(inputList[i])) {
      playNoteIfNotPlaying(i);
    } else {
      stopNoteIfPlaying(i);
    }
  }

  for (let i = 0; i < 7; i++) {
    // Digital pins
    if (values[i] == 0) {
      //print(i)
      playNoteIfNotPlaying(i);
      //if(i!=6) playNoteIfNotPlaying(i);
    } else {
      stopNoteIfPlaying(i);
    }
  }

  // change ramp/frequency based on slider values
  // exponential curve for ramp: long values only near top
  // let normalizedValue1 = slider1.value() / 1023; // Normalize to [0, 1]
  let normalizedValue1 = values[7] / 1023; // Normalize to [0, 1]
  let slider1Map = 0.1 * Math.pow(50, normalizedValue1);
  rampUpTime = slider1Map;
  rampDownTime = slider1Map * 1.5; // longer ramp down sounds better
  for (let i in monoSynths) {
    monoSynths[i].setADSR(rampUpTime, rampDownTime);
  }

  // exponential curve for frequency: 0=down 1 octave, 512=same octave, 1023=up 1 octave
  // so output needs to be 0.5 to 2, exponential
  //let normalizedValue2 = slider2.value() / 1023; // Normalize to [0, 1]
  let normalizedValue2 = values[8] / 1023; // Normalize to [0, 1]
  pitchBend = 0.5 * Math.pow(4, normalizedValue2);
}

/////////////////////////

// Serial functions

async function connectSerial() {
  if ("serial" in navigator) {
    try {
      // Request a serial port and open it
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      // Set up a reader to get data from the serial port
      const decoder = new TextDecoderStream();
      const inputDone = port.readable.pipeTo(decoder.writable);
      reader = decoder.readable.getReader();

      readSerial(); // Start reading data
    } catch (err) {
      console.error("Error connecting to serial port:", err);
    }
  } else {
    console.error("Web Serial API not supported in this browser.");
  }
}

async function readSerial() {
  let buffer = ""; // Accumulate incoming data

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("Stream closed.");
        break;
      }
      if (value) {
        // Accumulate data in the buffer
        buffer += value;

        // Check if we have one or more complete lines of data
        let lines = buffer.split("\n");

        // Process all complete lines except the last one
        for (let i = 0; i < lines.length - 1; i++) {
          let line = lines[i].trim();

          if (line) {
            // Process the line and split by commas
            let data = line.split(",").map((val) => parseInt(val.trim()));

            for (let i = 0; i < data.length; i++) {
              if (data[i] != -1) values[i] = data[i];
            }

            // If any values have changed, set array to incoming data
            //values = data;
          }
        }

        // Keep the leftover part of the buffer as incomplete data
        buffer = lines[lines.length - 1];
      }
    }
  } catch (err) {
    console.error("Error reading from serial port:", err);
  }
}

// Synth functions

function playNoteIfNotPlaying(index) {
  let frequency = frequencyList[index] * pitchBend;
  if (!activeNotes[index]) {
    monoSynths[index].triggerAttack(frequency, maxAmplitude, 0); // Trigger the note immediately
    activeNotes[index] = true; // Mark note as active
  }
}

function stopNoteIfPlaying(index) {
  if (activeNotes[index]) {
    monoSynths[index].triggerRelease(); // Release the note with the envelope’s release time
    activeNotes[index] = false; // Mark note as inactive
  }
}

function mousePressed() {}

