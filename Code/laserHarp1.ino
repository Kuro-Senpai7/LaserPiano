//By Christopher Lackey

int previousDigital[7] = { -1, -1, -1, -1, -1, -1, -1 };  // Initialize the previous state of digital pins

void setup() {
  Serial.begin(9600);
  for (int i = 2; i <= 8; i++) {
    pinMode(i, INPUT);  // Set the digital pins as INPUT
  }
}

void loop() {
  int currentValues[7];  // Array to store current digital input states

  // Read digital inputs and store the values
  for (int i = 2; i <= 8; i++) {
    currentValues[i - 2] = digitalRead(i);
  }

  // Send the values to Serial, checking for changes
  for (int i = 0; i < 7; i++) {
    if (currentValues[i] != previousDigital[i]) {
      // Send the new value when there is a change
      Serial.print(currentValues[i]);
    } else {
      // Send -1 if the value hasn't changed
      Serial.print(-1);
    }
      Serial.print(",");  // Separate values with commas
  }

  // Store the current values for the next iteration
  for (int i = 0; i < 7; i++) {
    previousDigital[i] = currentValues[i];
  }

  Serial.print(analogRead(A0));
  Serial.print(",");
  Serial.println(analogRead(A1));  // End line

  delay(50);  // Adjust delay as needed for sampling rate
}
