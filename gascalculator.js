//<script language="javascript">
//
// Technical Diving Gas Use/Cost/SCR Calculator
//
// Copyright (c) 2014,2015 - Opua Enterprises LLC.  All rights reserved.
//
// gkn@opua.org

var MetricUnits = false;

// Verify a cost input is within a given range

function verifyCost(input, min, max)
{
  var num = parseFloat(input.value);
  if (isNaN(num) || num < min || num > max) {
    alert("Please enter a number between " + min.toFixed(2) + " and " + max.toFixed(2));
    input.value = "";
    input.focus();
  } else
    gasUse();
  return;
}

// Verify an integer is positive

function verifyInt(input)
{
  var x = parseInt(input.value, 10);
  if (isNaN(x) || x < 0) {
    input.value = "";
    input.focus();
  } else
    gasUse();
  return;
}

// Make sure we have a valid gas mix

function verifyMix(input)
{
  var mix = ParseMix(input.value);  // Garbage collector will take care of the mix object
  if (!mix) {
    input.value = "";
    input.focus();
  } else {
    input.value = mix.fullName();
    gasUse();
  }
  return;
}

// Compute gas use

function gasUse()
{
  // Fetch the costs from the form;  the constructor for the GasMix object will take care of default values

  var elO2  = document.getElementById("costO2");
  var elHe  = document.getElementById("costHe");
  var elAir = document.getElementById("costAir");

  var costO2  = !isNaN(elO2.value)  ? parseFloat(elO2.value) : 0.0;
  var costHe  = !isNaN(elHe.value)  ? parseFloat(elHe.value) : 0.0;
  var costAir = !isNaN(elAir.value) ? parseFloat(elAir.value) : 0.0;

  // Fetch the average depth and time from the form

  var elAD = document.getElementById("avgDepth");
  var elDT = document.getElementById("diveTime");

  // A suffix of "m" can be used to input the depth in meters

  if (elAD.value && elAD.value.toLowerCase().endsWith("m")) {
    var d = parseFloat(elAD.value) * 3.2808399;
    if (d > 0 && d < 500) {
      elAD.value = Math.round(d).toFixed();
      MetricUnits = true;
    }
  }

  var avgDepth = !isNaN(elAD.value) ? parseInt(elAD.value, 10) : 0;
  var diveTime = !isNaN(elDT.value) ? parseInt(elDT.value, 10) : 0;

  var totalVolume = 0.0;
  var totalCost = 0.0;
  var scr = 0.0;

  // Iterate over each table row

  var bd = document.getElementById("showBreakdown").checked;
  var table = document.getElementById("cyls");

  for (var i = 0, row; row = table.rows[i]; i++) {

    // Each row in the table has
    //   cell[0] - Cylinder select
    //   cell[1] - deltaPSI
    //   cell[2] - mix input
    //   cell[3] - span for output

    var cyl = Cylinders[row.cells[0].firstElementChild.value];
    var mix = ParseMix(row.cells[2].firstElementChild.value);  // Garbage collector will take care of the mix object
    var span = row.cells[3].firstElementChild;

    // A suffix of "b" can be used to input the pressure in bar

    if (row.cells[1].firstElementChild.value &&
        (row.cells[1].firstElementChild.value.toLowerCase().endsWith("b") ||
         row.cells[1].firstElementChild.value.toLowerCase().endsWith("bar"))) {
      var p = parseFloat(row.cells[1].firstElementChild.value) * 14.503774;
      if (p > 0 && p <= cyl.Pressure * 1.5) {
        row.cells[1].firstElementChild.value = Math.round(p).toFixed();
        MetricUnits = true;
      }
    }
    var deltaPSI = parseFloat(row.cells[1].firstElementChild.value);

    if (mix)
      row.cells[2].firstElementChild.value = mix.fullName();

    if (cyl && (!isNaN(deltaPSI) && deltaPSI > 0.0)) {
      var volume = cyl.computeGasUse(deltaPSI);
      totalVolume += volume;
      totalCost += perCyl(cyl, mix, deltaPSI, volume, span, costO2, costHe, costAir, bd);
    } else
      span.innerHTML = "";
  }

  var resEl = document.getElementById("GasResults");
  var ppEl = document.getElementById("PayPal");

  if (totalVolume > 0.0) {

    // Display the total

    totalGasStr = "Total Gas Used: <b>" + totalVolume.toFixed(1) + " <i>ft&sup3;</i>";
    if (MetricUnits)
      totalGasStr += " (" + (totalVolume * 28.316847).toFixed(1) + " <i>liters</i>)";

    resEl.innerHTML = totalGasStr + "</b>";

    // Display the surface consumption rate if we know the average depth and time

    if (avgDepth > 0 && diveTime > 0) {
      var scr = totalVolume / (((avgDepth + 33.0) / 33.0) * diveTime);
      var scrString = "SCR: <b>" + scr.toFixed(2) + " <i>ft&sup3;/min</i>";
      if (MetricUnits)
        scrString += " (" + (scr * 28.316847).toFixed(2) + " <i>liters/min</i>)";
      document.getElementById("scrResults").innerHTML = scrString + "</b>";
    }

    // If we have cost data, display that

    if (totalCost > 0.0) {
      resEl.innerHTML += ":&nbsp;&nbsp;<b>$" + Math.round(totalCost).toFixed(2); + "</b>";
      emitPayPalButton(("Gas fill: " + totalVolume.toFixed(1) + " ft3"), Math.round(totalCost).toFixed(2), ppEl);
    }

  } else {
    resEl.innerHTML = "";
    ppEl.innerHTML = "";
  }
  return;
}

// Compute the gas use per cylinder

function perCyl(cyl, mix, dpsi, volume, span, co2, che, cair, bd)
{
  var cost = new GasCost(mix, cyl, dpsi, co2, che, cair);
  var tc = 0.0;

  span.innerHTML = volume.toFixed(1) + " <i>ft&sup3;</i>";
  if (MetricUnits)
    span.innerHTML += " (" + (volume * 28.316847).toFixed(1) + " <i>liters</i>)";
  if (mix && cost) {
    span.innerHTML += " of " +
                       (mix.fog ? mix.sarcasticName() : mix.fullName()) +
                       ": &nbsp;&nbsp;$" + Math.round(cost.TotalCost).toFixed(2) +
                       (!bd ? "" :
                        sprintf("&nbsp;[$%.2f per <i>ft&sup3;</i>]<small>&nbsp;&nbsp;(topMix = %.2f; O<sub>2</sub> Top = %.1f PSI, %.1f <i>ft&sup3;</i>, $%.2f; He = %.1f PSI, %.1f <i>ft&sup3;</i>, $%.2f; Air = %.1f PSI, %.1f <i>ft&sup3;</i>, $%.2f)</small>",
                        cost.perCubicFoot,
                        cost.Mix.topMix,
                        cost.O2Pressure,
                        cost.O2Volume,
                        cost.O2Cost,
                        cost.HePressure,
                        cost.HeVolume,
                        cost.HeCost,
                        cost.AirPressure,
                        cost.AirVolume,
                        cost.AirCost));
    tc = cost.TotalCost;
  }
  return (tc);
}

// Initialization

function Init(form)
{
  form.reset();

  var urlvars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    urlvars[key] = value;
  });

  MetricUnits = urlvars.propertyIsEnumerable('metric');

  // Enable the cost elements if so directed

  if (urlvars.propertyIsEnumerable('cost')) {

    document.getElementById("costs").style.display = "";
    document.getElementById("cyls").rows[0].cells[2].style.display = "";  // Mix
    document.getElementById("bdSpan").style.display = "";

    // Populate the form with default cost values

    var cost = new GasCost(null, null, 0);

    form.costO2.value = cost.costO2.toFixed(2);
    form.costHe.value = cost.costHe.toFixed(2);
    form.costAir.value = cost.costAir.toFixed(2);
  }

  // Enable the SCR elements if so directed

  if (urlvars.propertyIsEnumerable('scr'))
    document.getElementById("depthTime").style.display = "";

  // Populate the cylinder array

  var el = document.getElementById("cylSelect");
  var descr = "";
  var stagesMarker = false;
  var doublesMarker = false;
  var rebreatherMarker = false;

  var markerOpt = new Option("-----Singles-----", "", false, false);
  markerOpt.disabled = true;          
  el.add(markerOpt);

  for (var key in Cylinders) {
    if (Cylinders[key].Medical || Cylinders[key].Suit)
      continue;
    descr = Cylinders[key].Description + " (" +
            Cylinders[key].Volume.toFixed(1) + " ft3 at " +
            Cylinders[key].Pressure.toFixed() + " PSI, TF " +
            Cylinders[key].tankFactor.toFixed(1) +
            (MetricUnits ? (", " + Cylinders[key].waterCapacity.toFixed(1) + " L") : "") +
            ")";
   
    if (!stagesMarker && Cylinders[key].Stage && !Cylinders[key].BackGas) {
      markerOpt = new Option("-----Stages-----", "", false, false);
      markerOpt.disabled = true;
      el.add(markerOpt);
      stagesMarker = true;
    }

    if (!doublesMarker && Cylinders[key].Doubles) {
      markerOpt = new Option("-----Doubles-----", "", false, false);
      markerOpt.disabled = true;
      el.add(markerOpt);
      doublesMarker = true;
    }

    if (!rebreatherMarker && Cylinders[key].Rebreather && doublesMarker) {
      markerOpt = new Option("-----Rebreather-----", "", false, false);
      markerOpt.disabled = true;
      el.add(markerOpt);
      rebreatherMarker = true;
    }

    el.add(new Option(descr, key, null));
  } // for key in cylinders

  // Add multiple cylinders if directed by the URL variable nCyls

  var tEl = document.getElementById("cyls");
  var nCyls = urlvars.propertyIsEnumerable('nCyls') && parseInt(urlvars['nCyls'], 10);
  if (!isNaN(nCyls))
    for (nCyls--; nCyls > 0; nCyls--)
      addCylinder(tEl);

  // Now iterate over the cylinders, pre-selecting as designated by the URL variable cylN

  for (var i = 0, row; row = tEl.rows[i]; i++)
    if (urlvars.propertyIsEnumerable('cyl' + i))
      row.cells[0].firstElementChild.selectedIndex = findSelectIndex(row.cells[0].firstElementChild, urlvars['cyl' + i]);

  return;
}

// Add a cylinder to the table

function addCylinder(table)
{
  var newRow = table.rows[0].cloneNode(true);

  newRow.cells[0].firstElementChild.selectedIndex = 0;  // Cylinder select
  newRow.cells[1].firstElementChild.value = "";         // deltaPSI
  newRow.cells[2].firstElementChild.value = "";         // Mix
  newRow.cells[3].firstElementChild.innerHTML = "";     // span

  table.appendChild(newRow);
  return;
}

// Parse and validate a time input

function verifyTime(input)
{
  if (input.value) {
    var timeStr = input.value.toUpperCase();

    var hrsmin = timeStr.split(":");
    if (hrsmin.length > 1) {
      if (hrsmin[0] < 0 || hrsmin[0] > 99 || hrsmin[1] < 0 || hrsmin[1] > 59) {
        input.value = "";
        input.focus();
      } else
        input.value = ((parseInt(hrsmin[0], 10) * 60) + parseInt(hrsmin[1], 10)).toFixed();
    } else {
      var time = parseInt(timeStr, 10);
      if (isNaN(time) || time < 0 || time > 24*60) {
        input.value = "";
        input.focus();
      }
    }
    gasUse();
  }
  return;
}

// Find the proper select index for a given input and string

function findSelectIndex(input, string)
{
  var index = 0;
  for (var i, j = 0; i = input.options[j]; j++) {
    if (i.value == string) {
      index = j;
      break;
    }
  }
  return(index);
}
//</script>
