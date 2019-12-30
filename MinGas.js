//<script language="javascript">
//
// Minimum Gas Reserve Calculator
//
// Copyright (c) 2014,2015 - Opua Enterprises LLC.  All rights reserved.
//
// gkn@opua.org

// Initialization

function Init()
{
  // Populate the cylinder select

  var cylSel = document.getElementById("Cylinder");
  var descr = "";

  for (var key in Cylinders) {
    if (!Cylinders[key].Medical) {
      descr = Cylinders[key].Description + " (TF " + Cylinders[key].tankFactor.toFixed(1) + ")";
      cylSel.add(new Option(descr, key, null, null));
    }
  }
  return;
}

// Compute the minimum gas reserve

function minGas()
{
  // Need the cylinder

  var cylKey = document.getElementById("Cylinder").value;
  if (cylKey) {
    var cyl = Cylinders[cylKey];
    var probTime = parseFloat(document.getElementById("ProbTime").value);

    // Next we need the table populated with stop info

    var table = document.getElementById("theTable");
    if (table.rows.length - 1 > 0) {

      // Ok, we should (in theory) have some stops.  Compute the gas requirements:
      // At each stop, ATA * 2 (divers) * Emergency SCR * Stop time
      //
      // Compute the total ascent time and TTS (the latter includes the problem
      // resolution time)

      // Make sure that the last stop includes the problem resoultion time
      // (in case it changed and that's why we're here)

      table.rows[table.rows.length - 1].cells[2].firstElementChild.value = probTime.toFixed();

      var gasNeeded = 0.0;
      var ascentTime = 0;
      var eSCR = parseFloat(document.getElementById("SCR").value);

      // Walk the table computing gas requirements at each stop

      for (var i = 1; i < table.rows.length; i++) {
        var row = table.rows[i];

        // Row cells:
        //  0 - Pressure in ATA
        //  1 - Depth in FSW
        //  2 - Time input (firstElementChild)
        //  3 - Cubic Feet of gas needed
        //  4 - PSI from the cylinder for the needed gas volume

        var ata = parseFloat(row.cells[0].innerHTML);
        var stopTime = parseFloat(row.cells[2].firstElementChild.value);
        var cuFtCell = row.cells[3];
        var psiCell = row.cells[4];
        if (!isNaN(stopTime)) {
          var stopGas = ata * 2.0 * eSCR * stopTime;

          gasNeeded += stopGas;
          ascentTime += stopTime;

          cuFtCell.innerHTML = stopGas.toFixed(1);
          psiCell.innerHTML = Math.ceil(cyl.cuFtToPSI(stopGas)).toFixed();
        } else {
          cuFtCell.innerHTML = "&nbsp;";
          psiCell.innerHTML = "&nbsp;";
        }
      }

      // Now compute the time to the first stop and add that in to the ascent time

      var maxDepth = parseFloat(document.getElementById("MaxDepth").value);
      var firstStop = roundUp((maxDepth / 2), 10);
      var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);
      var avgATA = (((maxDepth + firstStop) / 2) / 33.0) + 1.0;

      ascentTime += ttfs;
      document.getElementById("TTS").value = ascentTime.toFixed();

      document.getElementById("ascentTime").value = (ascentTime - probTime).toFixed();

      // Gas needed for the portion of the ascent to the first stop

      var gasttfs = avgATA * 2.0 * eSCR * ttfs;
      gasNeeded += gasttfs;

      // Park the gas needed for the ascent to the first stop at the next deeper
      // stop depth in the table

      var r = table.rows[(firstStop / 10) + 1];
      r.cells[3].innerHTML = gasttfs.toFixed(1);
      r.cells[4].innerHTML = Math.ceil(cyl.cuFtToPSI(gasttfs)).toFixed();

      // Ok, at this point we know the total amount of gas we need.  Convert that
      // into PSI from the chosen cylinder.

      document.getElementById("minGasCF").style.color = "";
      document.getElementById("minGasCF").value = gasNeeded.toFixed(1);
      document.getElementById("minGasPSI").style.color = "";
      document.getElementById("minGasPSI").value = Math.max(500, roundUp(cyl.cuFtToPSI(gasNeeded), 100)).toFixed();

      // If the gas needed exceeds the capacity of the cylinder then make some noise

      warn = document.getElementById("Warning");

      // Believe the fill pressure if supplied, else default to a full cylinder

      var fillPel = document.getElementById("FillPressure");
      fillPel.style.color = "";
      var fillP = parseFloat(fillPel.value);
      if (isNaN(fillP) || fillP == 0.0)
        fillP = cyl.Pressure;

      if (gasNeeded > Math.min(cyl.Volume, cyl.computeGasUse(fillP))) {
        document.getElementById("minGasCF").style.color = "#ff0000";  // red
        document.getElementById("minGasPSI").style.color = "#ff0000";
        if (fillP < cyl.Pressure)
          fillPel.style.color = "#ff0000";
        warn.innerHTML = "<mark>Minimum Gas Reserve exceeds cylinder volume</mark>";
      } else
        warn.innerHTML = "";

      // Update the turn pressure if we know enough

      var rules = document.getElementsByName("GasRule[]");
      for (var i = 0; i < rules.length; i++) {
        if (rules[i].checked)
          turnPressure(rules[i], document.getElementById("TP"));
      }
    } // table.rows.length
  } // cylKey
  return;
}

// Verify a number is in a given range

function verifyNumber(input, min, max, sigFigs)
{
  var n = parseFloat(input.value);
  if (isNaN(n) || n < min || n > max) {
    alert("Please enter a value between " + min.toFixed(sigFigs) + " and " + max.toFixed(sigFigs));
    input.select();
    input.focus();
  } else
    input.value = n.toFixed(sigFigs);
  minGas();
  return;
}

// Process the maximum depth field

function processMaxDepth(input)
{
  var maxDepth = parseFloat(input.value);

  if (isNaN(maxDepth) || maxDepth < 10.0 || maxDepth > 130.0) {
    alert("Please enter a value between 10 and 130");
    input.select();
    input.focus();
    return;
  }
  maxDepth = roundUp(maxDepth, 10);
  input.value = maxDepth.toFixed();

  // Now populate the table

  var table = document.getElementById("addRowsHere");

  for (var i = table.rows.length - 1; i >= 0; i--)
    table.deleteRow(i);

  for (var i = 0; i < maxDepth / 10; i++) {

    var row = table.insertRow(i);

    var ataCell = row.insertCell(0);
    var depthCell = row.insertCell(1);
    var timeCell = row.insertCell(2);
    var cuFtCell = row.insertCell(3);
    var psiCell = row.insertCell(4);

    ataCell.style.textAlign = "center";
    depthCell.style.textAlign = "center";
    timeCell.style.textAlign = "center";
    cuFtCell.style.textAlign = "center";
    psiCell.style.textAlign = "center";

    var depth = (i * 10.0) + 10.0;

    // Ambient pressure in atmospheres absolute

    var ata = (depth / 33.0) + 1.0;
    ataCell.innerHTML = ata.toFixed(1);

    // Depth in FSW

    depthCell.innerHTML = depth.toFixed();

    // Time - input value

    var timeInput = document.createElement("input");
    timeInput.type = "text";
    timeInput.name = "stop" + depth.toFixed();
    timeInput.id = "stop" + depth.toFixed();
    timeInput.size = 3;
    timeInput.maxLength = 3;
    timeInput.style.textAlign = "center";
    timeInput.readOnly = document.getElementById("minDecoCB").checked;
    timeInput.onchange = function() { minGas(); };
    timeCell.appendChild(timeInput);

    // Work around Safari bugs - empty cells do not have borders

    cuFtCell.innerHTML = "&nbsp;";
    psiCell.innerHTML = "&nbsp;";
  }

  // Give the table to processMinDeco()

  processMinDeco();
  return;
}

// Process the min deco checkbox

function processMinDeco()
{
  var readOnly = document.getElementById("minDecoCB").checked;
  var table = document.getElementById("theTable");

  // Adjust the fungability of the time inputs in the table based on min deco

  for (var i = 1, row; row = table.rows[i]; i++)         // Start at 1 to skip the table header
    row.cells[2].firstElementChild.readOnly = readOnly;

  // If min Deco, populate the table with stops

  if (readOnly) {

    var maxDepth = parseFloat(document.getElementById("MaxDepth").value);
    var firstStop = roundUp((maxDepth / 2), 10);
    var TTS = 0;
    var ascentTime = 0;

    for (var i = 1, row;  row = table.rows[i]; i++) {

      var tCellInput = row.cells[2].firstElementChild;

      // Min deco stops every 10 feet for 1 minute up to the first stop

      if (i <= firstStop / 10.0) {
        tCellInput.value = "1";
        TTS++;
        ascentTime++;
      } else {

        // After the first stop, times are 0 except for the bottom

        if (i < table.rows.length - 1)
          tCellInput.value = "";
        else {

          // Set the bottom time element to the problem resolution time

          var pTime = parseFloat(document.getElementById("ProbTime").value);
          tCellInput.value = pTime.toFixed();
          TTS += pTime;

          // Include ascent time to first stop

          var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);

          TTS += ttfs;
          ascentTime += ttfs;

          document.getElementById("TTS").value = TTS.toFixed();
          document.getElementById("ascentTime").value = ascentTime.toFixed();
        }
      } // else after 1st stop
    } // for
  } // input.checked

  minGas();
  return;
}

// Process the fill pressure field

function processFillPressure(input, cylSelect)
{
  if (cylSelect.selectedIndex) {

    var minFillP = Cylinders[cylSelect.value].Pressure * 0.3;
    var maxFillP = Cylinders[cylSelect.value].Pressure * 1.5;
    var fillP = parseFloat(input.value);

    if (isNaN(fillP) || fillP < minFillP || fillP > maxFillP) {
      alert("Please enter a value between " + minFillP.toFixed() + " and " + maxFillP.toFixed());
      input.select();
      input.focus();
    } else {
      input.value = roundDown(fillP, 100).toFixed();
      minGas();
    }
  }
  return;
}

// Calculate the turn pressure

function turnPressure(rule, TP)
{
  // Need the fill pressure

  var fillP = parseFloat(document.getElementById("FillPressure").value);
  if (isNaN(fillP) || fillP == 0)
    return;

  // Need the minumum gas

  var minGas = parseFloat(document.getElementById("minGasPSI").value);
  if (isNaN(minGas) || minGas == 0)
    return;

  // Useable gas

  var useableGas = roundDown((fillP - minGas), 100);

  // May twiddle text based on rule

  var tpLabel = document.getElementById("tpId");

  // Turn pressure based on gas use rule

  switch (rule.value) {

    // All useable

    case "All":
      TP.value = roundUp((fillP - useableGas), 100).toFixed();
      tpLabel.innerHTML = "Ascent Pressure";
      break;

    // Half useable

    case "Half":
      TP.value = roundUp((fillP - (useableGas / 2.0)), 100).toFixed();
      tpLabel.innerHTML = "Turn Pressure";
      break;

    // One third useable

    case "Thirds":
      TP.value = roundUp((fillP - (useableGas / 3.0)), 100).toFixed();
      tpLabel.innerHTML = "Turn Pressure";
      break;

    default:
      alert("gasRule - WTF?");
      break;
  }
  return;
}

// Round up to the nearest multiple of up

function roundUp(n, up)
{
  if (n % up == 0)
    return (n);
  else
    return (n + (up - (n % up)));
}

// Round down to the nearest multiple of down

function roundDown(n, down)
{
  return (n - (n % down));
}
//</script>
