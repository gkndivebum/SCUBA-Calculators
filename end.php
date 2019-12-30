<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
<title>Equivalent Narcotic Depth Table Generator</title>
<link rel="shortcut icon" href="favicon.ico">
</head>
<body>
<h4>Equivalent Air/Narcotic Depth Table</h4>
<form action="#" method="post">
<p>Mix:&nbsp;<input type="text" name="mix" size=7 maxlength=7 />&nbsp;&nbsp;&nbsp;&nbsp;
<input type="submit" name="calculate" value="Calculate"></p>
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

  $mix = ParseMix(preg_replace('/\s+/', '', filter_input(INPUT_POST, 'mix', FILTER_SANITIZE_STRIPPED)));
  if (!$mix)
    exit("Invalid gas mix");

  $fInert = 1.0 - $mix->fO2;
  $pO2Color = "";
  $endColor = "";
  $densPercentAir = 1.0;

  // Compute max depth for gas

  $maxDepth = 0;
  if (isset($_GET['maxDepth']))
    $maxDepth = RoundUp10((int)filter_input(INPUT_GET, 'maxDepth', FILTER_SANITIZE_NUMBER_INT));
  if ($maxDepth == 0)
    $maxDepth = RoundUp10($mix->MOD(1.6));

  // Compute gas density relative to air

  if ($mix->fO2 != 0.21 || $mix->fHe > 0.0) {
    $air = ParseMix("Air");
    $Density = $mix->Density(1.0);
    $densPercentAir = round((($Density * 100.0) / $air->Density(1.0)), 1);
  }

  // Print header

  printf("<hr>Equivalent %s Depth Table using <b>%s</b>.<br>", ($mix->fHe > 0.0 ? "Narcotic" : "Air"), $mix->FullName());
  echo 'MOD <b>' . floor($mix->MOD(1.6)) . '</b> FSW (1.6 ATA);  <b>' . floor($mix->MOD(1.4)) . '</b> FSW (1.4 ATA)';
  if ($mix->Type != "Air")
    echo '<br>Gas density is <b>' . $densPercentAir . '%</b> of air.';
  echo '<br>Depths in FSW. Pressures in ATA. Densities in gm/L at ambient pressure.';

  echo '<br><br><table style="border-style:none;border-spacing:1px;padding:1px"><th>&nbsp;Depth</th><th>&nbsp;Pressure</th><th>&nbsp;pO<sub>2</sub></th><th>&nbsp;pInert</th><th>&nbsp;E';
  echo ($mix->fHe > 0.0 ? 'N' : 'A');
  echo 'D</th><th>&nbsp;Density</th>';

  // Calculate EAD/END and density in 10 foot steps

  for ($i = 1; $i <= ($maxDepth / 10); $i++) {

    $Depth = $i * 10;                                 // FSW
    $Pressure = ((((double)($Depth)) + 33.0) / 33.0); // ATA
    $pO2 = $mix->fO2 * $Pressure;                     // PO2 in ATA
    $pInert = $fInert * $Pressure;                    // Inert gas pressure in ATA

    $EAD = floor(($fInert / 0.79) * (double)$Depth);   // Equivalent Air Depth
    $END = floor(($mix->fN2 / 0.79) * (double)$Depth); // Equivalent Narcotic Depth

    $Density = $mix->Density($Pressure);

    $pO2Color = $pO2 > 1.6 ? ';color:blue' : '';

    echo '<tr>';
    echo '<td style="text-align:center">' . $Depth . '</td>';
    echo '<td style="text-align:center">' . sprintf('%.2f', round($Pressure, 2)) . '</td>';
    echo '<td style="text-align:center' . $pO2Color . '">' . sprintf('%.2f', round($pO2, 2)) . '</td>';
    echo '<td style="text-align:center">' . sprintf('%.2f', round($pInert, 2)) . '</td>';

    // END .gt. 100  in Red

    $endColor = $mix->fHe > 0.0 && $END > 100.0 ? ';color:red' : '';

    echo '<td style="text-align:center';
    if ($mix->fHe == 0.0)
      echo '">' . $EAD;
    else
      echo $endColor .'">' . $END;
    echo '</td><td style="text-align:center">' . sprintf('%.2f', round($Density, 2)) . '</td>';
  }
  echo '</table><br>';

  // Warning?

  if ($pO2Color)
    echo '<div style="' . substr($pO2Color, 1) . '"><small><i>PO<sub>2</sub> exceeds 1.6 ATA</i></small></font></div>';
  if ($endColor)
    echo '<div style="' . substr($endColor, 1) . '"><small><i>END exceeds 100 FSW</i></small></font></div>';
}
?>
</body>
</html>
