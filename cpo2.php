<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
<title>Constant PPO2 Table Generator</title>
<link rel="shortcut icon" href="favicon.ico">
</head>
<body>
<h4>Constant PPO<sub>2</sub> Table</h4>
<form action="#" method="post">
<p>Set Point:&nbsp;<select name="setPoint" >
<option value="0.7">0.7</option>
<option value="0.8">0.8</option>
<option value="0.9">0.9</option>
<option value="1.0">1.0</option>
<option value="1.1">1.1</option>
<option value="1.2">1.2</option>
<option selected value="1.3">1.3</option>
<option value="1.4">1.4</option>
</select>&nbsp;&nbsp;&nbsp;&nbsp;Diluent:&nbsp;<input type="text" name="diluent" size=7 maxlength=7 />&nbsp;&nbsp;&nbsp;&nbsp;Maximum depth:&nbsp;<input type="text" name="maxDepth" size=3 maxlength=3 />&nbsp;<smaller><i>(optional)</i></smaller></p>
<input type="submit" name="calculate" value="Calculate">
</form>
<?php
require_once("GasMix.php");

// Round up to the nearest multiple of 10

function RoundUp10($value) {
   if ($value % 10 == 0) return $value;
   return $value + (10 - ($value % 10));
}

// Did we hit calculate?

if (isset($_POST['calculate']) && filter_input(INPUT_POST, 'calculate', FILTER_SANITIZE_STRIPPED) == 'Calculate') {

  // Convert form variables

  $mix = ParseMix(preg_replace('/\s+/', '', filter_input(INPUT_POST, 'diluent', FILTER_SANITIZE_STRIPPED)));
  if (!$mix)
    exit("Invalid diluent gas");

  $setPoint = (double) filter_input(INPUT_POST, 'setPoint', FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

  // Small-kine sanity checks

  if ($mix->fHe > 0.98)
    exit("Diluent He fraction must be < 0.99");

  if ($mix->fO2 < 0.02 || $mix->fO2 > 0.35)
    exit("Diluent O<sub>2</sub> fraction must be between 0.02 and 0.35");

  // Compute max depth for diluent gas at given setpoint

  $maxDepth = 0;
  if (isset($_POST['maxDepth']))
    $maxDepth = RoundUp10((int) filter_input(INPUT_POST, 'maxDepth', FILTER_SANITIZE_NUMBER_INT));
  if ($maxDepth == 0)
    $maxDepth = RoundUp10((int)$mix->MOD($setPoint));

  // Print header

  printf("<hr>Constant %.1f PO<sub>2</sub> table using <b>%s</b> diluent.<br>", $setPoint, $mix->longName());
  echo 'Diluent MOD <b>' . floor($mix->MOD($setPoint)) . '</b> FSW (' . $setPoint . ' ATA), <b>' . floor($mix->MOD(1.6)) . '</b> FSW (1.6 ATA)<br>';
  echo 'On-gassing starts at <b>' . floor(($setPoint + 0.79 - 1.0) * 33.0) . '</b> FSW.<br>';
  echo 'Depths in FSW. Pressures in ATA. Densities in gm/L at ambient pressure (with percentage relative to air).<br><br>';
  echo '<table style="border-style:none;border-spacing:0px;padding:0px">';

  if ($mix->fHe > 0.0) {

    // For trimix diluent, we have Depth, ATA, ppN2, ppHe, fO2, fHe, fN2, END and Density

    echo '<col style="width:50px"><col style="width:40px"><col style="width:60px"><col style="width:60px"><col style="width:60px"><col style="width:60px"><col style="width:60px"><col style="width:40px"><col style="width:110px">';
    echo '<th>Depth</th><th>ATA</th><th>ppN<sub>2</sub></th><th>ppHe</th><th>fO<sub>2</sub></th><th>fHe</th><th>fN<sub>2</sub></th><th>END</th><th>Density</th>';
  } else {

    // For air diluent, we have Depth, ATA, ppN2, fO2, EAD and Density

    echo '<col style="width:50px"><col style="width:40px"><col style="width:60px"><col style="width:60px"><col style="width:40px"><col style="width:110px">';
    echo '<th>Depth</th><th>ATA</th><th>ppN<sub>2</sub></th><th>fO<sub>2</sub></th><th>EAD</th><th>Density</th>';
  }

  // Calculate FO2, EAD/END, density in 10 foot steps

  $dilWarn = 0;
  $exdWarn = 0;
  $densWarn = 0;

  $mixAir = ParseMix("Air");

  for ($i = 1; $i <= ($maxDepth / 10); $i++) {

    $Depth = $i * 10;                                 // FSW
    $Pressure = ((((double)($Depth)) + 33.0) / 33.0); // ATA
    $fO2 = $setPoint / $Pressure;                     // Loop O2 fraction
    $fInert = 1.0 - $fO2;                             // Loop inert gas fraction
    $pInert = $fInert * $Pressure;                    // Loop inert gas pressure in ATA
    $fN2 = $fInert * ((1.0 / ($mix->fN2 + $mix->fHe)) * $mix->fN2); // Loop N2 fraction
    $fHe = $fInert * ((1.0 / ($mix->fN2 + $mix->fHe)) * $mix->fHe); // Loop He fraction
    $pN2 = $fN2 * $Pressure;                          // Loop N2 pressure
    $pHe = $fHe * $Pressure;                          // Loop He pressure

    $EAD = floor(($fInert / 0.79) * (double)$Depth);  // Equivalent Air Depth
    $END = floor(($fN2 / 0.79) * (double)$Depth);     // Equivalent Narcotic Depth

    $mixType = $fHe == 0.0 ? "Nitrox" : $fN2 == 0.0 ? "Heliox" : "Trimix";
    $loopMix = new GasMix($mixType, $fO2, $fHe);      // Actual gas mix in the loop
    $Density = $loopMix->Density($Pressure);

    echo '<tr style="vertical-align:top;horizonal-align:center">';
    echo '<td style="text-align:center">' . $Depth . '</td>';
    echo '<td style="text-align:center">' . sprintf('%.2f', round($Pressure, 2)) . '</td>';
    echo '<td style="text-align:center">' . sprintf('%.2f', round($pN2, 2)) . '</td>';
    if ($mix->fHe > 0.0)
      echo '<td style="text-align:center">' . sprintf('%.2f', round($pHe, 2)) . '</td>';

    // Diluent fO2 .gt. Loop fO2 in Green

    echo '<td style="text-align:center';
    if ($mix->fO2 > $fO2) {
      echo ';color:lime';
      $dilWarn++;
    }
    echo '">' . sprintf('%.3f', round($fO2, 3)) . '</td>';

    if ($mix->fHe > 0.0) {
      echo '<td style="text-align:center">' . sprintf('%.3f', round($fHe, 3)) . '</td>';
      echo '<td style="text-align:center">' . sprintf('%.3f', round($fN2, 3)) . '</td>';
    }

    // EAD .gt. actual depth or END .gt. 100  in Red

    echo '<td style="text-align:center';
    if (($mix->fHe > 0.0 && $END > 100.0) || ($mix->fHe == 0.0 && $EAD > $Depth)) {
      echo ';color:red';
      $exdWarn++;
    }
    echo '">' . ($mix->fHe > 0.0 ? $END : $EAD) . '</td>';

    // Gas density

    echo '<td style="text-align:center';
    $densPercentAir = sprintf('%.1f', round((($Density * 100.0) / $mixAir->Density($Pressure)), 1));
    if ($densPercentAir > 100.0) {
      echo ';color:blue';
      $densWarn++;
    }
    echo '">' . sprintf('%.2f', round($Density, 2)) . ' (<small>' . $densPercentAir . '%' . ')</small></td></tr>';
  }
  echo '</table><br>';

  // Warnings?

  if ($dilWarn)
    echo '<div style="color:lime;"><small><i>Diluent FO<sub>2</sub> exceeds loop FO<sub>2</sub></i></small></div>';
  if ($exdWarn) {
    echo '<div style="color:red;"><small><i>';
    if ($mix->fHe > 0.0)
      echo 'END exceeds 100 FSW';
    else
      echo 'EAD exceeds actual depth';
    echo '</i></small></div>';
  }
  if ($densWarn)
    echo '<div style="color:blue;"><small><i>Density exceeds that of air</i></small></div>';
}
?>
</body>
</html>
