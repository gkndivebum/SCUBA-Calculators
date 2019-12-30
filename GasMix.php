<?php
// GasMix.php
//
// Gas Mixture routines
//
// Author:  Gerard K. Newman, gkn@opua.org
// Date:    25 Aug 2013

require_once("cylinder.php");
require_once("./invoice/invoiceConnectDB.php");

// $$$ Default Gas Prices

$GasPrices = Array("Oxygen" => 1.10,
                   "Helium" => 4.50,
                   "Argon" => 0.75,
                   "Air" => 0.15,
                   "FOGDiscount" => 0.75,
                   "COGOxygen" => 0.70,
                   "COGHelium" => 3.28,
                   "COGArgon" => 0.30,
                   "COGAir" => 0.05);
$GasPricesFetched = 0;


// Gas Mix object

class GasMix
{
  public $Type, $fO2, $fHe, $fN2, $fAr, $topMix, $fog;

  public function __construct($t, $fo2, $fhe) {
    $this->Type = $t;
    $this->fO2 = (float) $fo2;
    $this->fHe = (float) $fhe;
    $this->fN2 = (float) ((($fo2 + $fhe) > 0.0) ? (1.0 - ($fo2 + $fhe)) : 0.0);
    $this->fAr = (float) ((($fo2 + $fhe) == 0.0) ? 1.0 : 0.0);
    $this->topMix = (float) ($fo2 == 0.0 ? 0.0 : ($fo2 / (1.0 - $fhe)));
    $this->fog = GasMixGetFog();
    return;
  }

  public function longName() {
    switch ($this->Type) {
      case "Nitrox": return(sprintf("EAN%d", $this->fO2 * 100.0));
      case "Trimix": return(sprintf("Trimix %d/%d", $this->fO2 * 100.0, $this->fHe * 100.0));
      case "Heliox": return(sprintf("Heliox %d/%d", $this->fO2 * 100.0, $this->fHe * 100.0));
      case "Argon":
      case "Air":
      case "Oxygen":
      case "Helium":
      default:       return($this->Type);
    }
  }

  public function fullName() {
    switch ($this->Type) {
      case "Nitrox": return(sprintf("EAN%d", $this->fO2 * 100.0));
      case "Trimix": return(sprintf("Tx%d/%d", $this->fO2 * 100.0, $this->fHe * 100.0));
      case "Heliox": return(sprintf("Hx%d/%d", $this->fO2 * 100.0, $this->fHe * 100.0));
      case "Argon":
      case "Air":
      case "Oxygen":
      case "Helium":
      default:       return($this->Type);
    }
  }

  public function mediumName() {
    switch ($this->Type) {
      case "Nitrox": return(sprintf("%d", $this->fO2 * 100.0));
      case "Trimix":
      case "Heliox": return(sprintf("%d/%d", $this->fo2 * 100.0, $this->fHe * 100.0));
      case "Argon":
      case "Air":
      case "Oxygen":
      case "Helium":
      default:       return($this->Type);
    }
  }

  public function shortName() {
    switch ($this->Type) {
      case "Air":
      case "Nitrox": return(sprintf("%d", $this->fO2 * 100.0));
      case "Trimix":
      case "Heliox": return(sprintf("%d/%d", $this->fo2 * 100.0, $this->fHe * 100.0));
      case "Argon":  return("Ar");
      case "Oxygen": return("O2");
      case "Helium": return("He");
      default:       return($this->Type);
    }
  }

  public function sarcasticName() {
    switch ($this->Type) {
      case "Nitrox": return(($this->fO2 == 0.8 ? "Stroke Mix" : sprintf("EAN%d", $this->fO2 * 100.0)));
      case "Trimix": return(sprintf("Tx%d/%d", $this->fO2 * 100.0, $this->fHe * 100.0));
      case "Heliox": return(sprintf("Hx%d/%d", $this->fo2 * 100.0, $this->fHe * 100.0));
      case "Air":    return("Tire Inflation Gas");
      case "Argon":
      case "Oxygen":
      case "Helium":
      default:       return($this->Type);
    }
  }

  public function Density($ata) {
    $densityAir = 1.1839;    // Densities in gm/L at 1ATA, 25 degC
    $densityHe  = 0.1636;
    $densityO2  = 1.3079;
    $densityN2  = 1.1450;

    if ($this->Type == "Air")
      return ($densityAir * $ata);
    else
      return ((($densityO2 * $this->fO2) + ($densityHe * $this->fHe) + ($densityN2 * $this->fN2)) * $ata);
  }

  public function MOD($ata) {
    return ((($ata / $this->fO2) - 1.0) * 33.0);
  }

  public function PO2($depth) {
    return ((($depth / 33.0) + 1.0) * $this->fO2);
  }

  public function END($depth) {
    return (($this->$fN2 / 0.79) * depth);
  }
}

// Gas Cost object

class GasCost
{
  public $Mix, $Cyl, $deltaPSI, $TotalVolume, $TotalCost, $perCubicFoot,
         $O2Pressure, $O2Volume, $O2Cost,
         $HePressure, $HeVolume, $HeCost,
         $ArPressure, $ArVolume, $ArCost,
         $AirPressure, $AirVolume, $AirCost,
         $fog, $fogDiscount, $costO2, $costHe, $costAir, $costAr;

  public function __construct($mixObj, $cylObj,$dPSI) {

    $this->Mix = $mixObj;
    $this->Cyl = $cylObj;
    $this->deltaPSI = (float) $dPSI;
    $this->TotalVolume = 0.0;

    $this->O2Presure = 0.0;
    $this->O2Volume = 0.0;
    $this->O2Cost = 0.0;

    $this->HePresure = 0.0;
    $this->HeVolume = 0.0;
    $this->HeCost = 0.0;

    $this->ArPresure = 0.0;
    $this->ArVolume = 0.0;
    $this->ArCost = 0.0;

    $this->AirPresure = 0.0;
    $this->AirVolume = 0.0;
    $this->AirCost = 0.0;

    $this->TotalCost = 0.0;
    $this->perCubicFoot =0.0;
    $this->cog = 0.0;
    $this->cogPerCubicFoot = 0.0;

    global $GasPrices, $GasPricesFetched;  // yak.

    if (isset($_GET['UseDB']) && !$GasPricesFetched)
      GasMixGetGasPrices($GasPrices, $GasPricesFetched);

    // Gas prices

    $this->costO2  = $GasPrices['Oxygen'];
    $this->costHe  = $GasPrices['Helium'];
    $this->costAr  = $GasPrices['Argon'];
    $this->costAir = $GasPrices['Air'];

    // Cost of goods for each gas

    $this->cogO2  = $GasPrices['COGOxygen'];
    $this->cogHe  = $GasPrices['COGHelium'];
    $this->cogAr  = $GasPrices['COGArgon'];
    $this->cogAir = $GasPrices['COGAir'];

    // Friend?

    $this->fogDiscount = 0.0;
    $this->fog = false;
    if (GasMixGetFog() && $GasPrices['FOGDiscount'] > 0.0) {
      $this->fog = true;
      $this->fogDiscount = $GasPrices['FOGDiscount'];
    }

    // Sanity check the discount Rate

    if ($this->fog) {
      $error = 0;
      $discO2 = $this->fogDiscount * $this->costO2;
      if ($discO2 < $this->cogO2) {
        error_log("Discount O2 cost less than cost of goods: " . $discO2 . " < " . $this->cogO2);
        $error++;
      }
      $discHe = $this->fogDiscount * $this->costHe;
      if ($discHe < $this->cogHe) {
        error_log("Discount He cost less than cost of goods: " . $discHe . " < " . $this->cogHe);
        $error++;
      }
      $discAr = $this->fogDiscount * $this->costAr;
      if ($discAr < $this->cogAr) {
        error_log("Discount Ar cost less than cost of goods: " . $discAr . " < " . $this->cogAr);
        $error++;
      }
      $discAir = $this->fogDiscount * $this->costAir;
      if ($discAir < $this->cogAir) {
        error_log("Discount Air cost less than cost of goods: " . $discAir . " < " . $this->cogAir);
        $error++;
      }
      if ($error) {
        $this->fog = false;
        $this->fogDiscount = 0.0;
      } else {
        $this->costO2  *= $this->fogDiscount;
        $this->costHe  *= $this->fogDiscount;
        $this->costAr  *= $this->fogDiscount;
        $this->costAir *= $this->fogDiscount;
      }
    }

    // If no mix, just return the O2, He, Ar and Air prices

    if (!$mixObj)
      return;

    // Hack alert.  If supplied with a null cylinder object then just return the
    // gas prices, including the price per cubic foot.  To do this we must create
    // a dummy cylinder object and then run thru the mixing calculations below.

    if (!$cylObj) {
      $cylObj = new Cylinder("Dummy", "Dummy", 1.0, 100.0, 28.32, 6.8);
      $dPSI = $cylObj->Pressure;
    }

    // Pure/non-mixed gas cases first

    if ($mixObj->fO2 == 1.0) {

      // Oxygen

      $this->O2Pressure = $dPSI;
      $this->perCubicFoot = $this->costO2;
      $this->O2Volume = $cylObj->computeGasUse($dPSI);
      $this->TotalVolume = $this->O2Volume;
      $this->TotalCost = $this->costO2 * $this->O2Volume;
      $this->O2Cost = $this->TotalCost;
      $this->cog = $this->cogO2 * $this->O2Volume;
      $this->cogPerCubicFoot = $this->cog / $this->TotalVolume;

    } else if ($mixObj->fHe == 1.0) {

      // Helium

      $this->HePressure = $dPSI;
      $this->perCubicFoot = $this->costHe;
      $this->HeVolume = $cylObj->computeGasUse($dPSI);
      $this->TotalVolume = $this->HeVolume;
      $this->TotalCost = $this->costHe * $this->HeVolume;
      $this->HeCost = $this->TotalCost;
      $this->cog = $this->cogHe * $this->HeVolume;
      $this->cogPerCubicFoot = $this->cog / $this->TotalVolume;

    } else if ($mixObj->fAr == 1.0) {

      // Argon

      $this->ArPressure = $dPSI;
      $this->perCubicFoot = $this->costAr;
      $this->ArVolume = $cylObj->computeGasUse($dPSI);
      $this->TotalVolume = $this->ArVolume;
      $this->TotalCost = $this->costAr * $this->ArVolume;
      $this->ArCost = $this->TotalCost;
      $this->cog = $this->cogAr * $this->ArVolume;
      $this->cogPerCubicFoot = $this->cog / $this->TotalVolume;

    } else if ($mixObj->fO2 == 0.21 && $mixObj->fHe == 0.0) {

      // Air

      $this->AirPressure = $dPSI;
      $this->perCubicFoot = $this->costAir;
      $this->AirVolume = $cylObj->computeGasUse($dPSI);
      $this->TotalVolume = $this->AirVolume;
      $this->TotalCost = $this->costAir * $this->AirVolume;
      $this->AirCost = $this->TotalCost;
      $this->cog = $this->cogAir * $this->AirVolume;
      $this->cogPerCubicFoot = $this->cog / $this->TotalVolume;

    } else {

      // Mixed gas

      $this->HePressure = $dPSI * $mixObj->fHe;
      $this->O2Pressure = ((($mixObj->topMix - 0.21) / 0.79) * ($dPSI - $this->HePressure));
      $this->AirPressure = $dPSI - $this->HePressure - $this->O2Pressure;

      // Volumes [in this cylinder]

      $this->O2Volume = $cylObj->computeGasUse($this->O2Pressure);
      $this->HeVolume = $cylObj->computeGasUse($this->HePressure);
      $this->AirVolume = $cylObj->computeGasUse($this->AirPressure);
      $this->TotalVolume = $this->O2Volume + $this->HeVolume + $this->AirVolume;

      // Costs

      $this->O2Cost = $this->O2Volume * $this->costO2;
      $this->HeCost = $this->HeVolume * $this->costHe;
      $this->AirCost = $this->AirVolume * $this->costAir;
      $this->TotalCost = $this->O2Cost + $this->HeCost + $this->AirCost;
      $this->perCubicFoot = $this->TotalCost / $this->TotalVolume;
      $this->cog = ($this->cogO2 * $this->O2Volume) + ($this->cogHe * $this->HeVolume) + ($this->cogAir * $this->AirVolume);
      $this->cogPerCubicFoot = $this->cog / $this->TotalVolume;
    }

    // Hack alert - if supplied with a null cylinder object, we've been asked for the gas
    // costs, including the per cubic foot value.  To compute that we've created a dummy
    // cylinder object, which we must now forget.  The garbage collector will take care
    // of deallocating the dummy cylinder object for us.

    return;
  }
}

// Parse a gas mix name
//
// Returns a GasMix object
//
// Examples:
//
//   EAN32
//   32
//   21
//   Trimix 21/35
//   Heliox 7/93
//   Oxygen
//   Helium
//   Air
//   Argon
//
// Transformations:
//
//   21/0 -> Air
//   EAN100 -> Oxygen
//   9/91 -> Heliox 9/91

function ParseMix($mix)
{
  if (!$mix)
    return(null);

  // Match TxOO/HH / Trimix OO/HH / OO/HH

  if (preg_match('/[tx|trmix|hx|heliox]?\s?(\d{1,2})\/(\d{1,2})/i', $mix, $gasses)) {

    $fO2 = (float) $gasses[1];
    $fHe = (float) $gasses[2];

    // Sanity checks

    if (is_nan($fO2) || is_nan($fHe) || ($fO2 + $fHe) > 100.0 || ($fHe == 0 && $fO2 < 21.0))
      return(null);

    // No helium -> nitrox

    if ($fHe == 0.0)
      return new GasMix(($fO2 == 21.0 ? "Air" : "Nitrox"), ($fO2 / 100.0), 0.0);

    // Trimix or heliox

    return new GasMix((($fO2 + $fHe) == 100.0 ? "Heliox" : "Trimix"), ($fO2 / 100.0), ($fHe / 100.0));
  }

  // Match EANx / Nitrox x / naked fO2

  else if (preg_match('/[ean|nitrox]?\s?(\d{2,3})/i', $mix, $gasses)) {

    $fO2 = (float) $gasses[1];

    // Sanity checks  fO2 > 0.21 && <= 1.0

    if (is_nan($fO2) || $fO2 < 21.0 || $fO2 > 100.0)
      return(null);

    // EAN100 -> Oxygen

    if ($fO2 == 100.0)
      return new GasMix("Oxygen", 1.0, 0.0);

    // EAN21 -> Air

    if ($fO2 == 21.0)
      return new GasMix("Air", 0.21, 0.0);

    // Nitrox

    return new GasMix("Nitrox", ($fO2 / 100.0), 0.0);
  }

  // Match Oxygen

  else if (preg_match('/oxygen|o2/i', $mix))
    return new GasMix("Oxygen", 1.0, 0.0);

  // Match Helium

  else if (preg_match('/helium|he/i', $mix))
    return new GasMix("Helium", 0.0, 1.0);

  // Match Air

  else if (preg_match('/air/i', $mix))
    return new GasMix("Air", 0.21, 0.0);

  // Match Argon

  else if (preg_match('/argon|ar/i', $mix))
    return new GasMix("Argon", 0.0, 0.0);

  else
    return(null);
}

// Get "Friend Of Gerard"

function GasMixGetFog()
{
//  error_log("GasMixGetFog():  GET variable FOG is " . isset($_GET['FOG'])); //%%%
  return (isset($_GET['FOG']));
}

// Retrieve gas prices from the database

function GasMixGetGasPrices(&$GasPrices, &$GasPricesFetched)
{
  global $invDB;

  $query = "SELECT * FROM `GasPrices`";
  $result = mysqli_query($invDB, $query);
  if (!$result)
    invoiceDBError($invDB, $query, "SELECT", "GasPrices", "GasMix.php", __FILE__, __LINE__);
  else {
    $GasPrices = array_replace($GasPrices, mysqli_fetch_array($result, MYSQLI_ASSOC));
    $GasPricesFetched = true;
//    error_log("Gas Prices Fetched");
  }

  return;
}
?>
