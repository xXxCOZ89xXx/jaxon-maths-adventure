# Synthetic runtime checks. Extract only the real helper functions/assignment;
# never execute the owner verifier's main body or connect to any database.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot '../scripts/windows/Verify-CurrentGameBackup.ps1'
$errors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Resolve-Path $scriptPath).Path, [ref]$null, [ref]$errors)
if ($errors.Count) { throw 'Verifier syntax failed' }
$hashFunction = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -ceq 'Rows-Hash' }, $true)
Invoke-Expression $hashFunction.Extent.Text
$copyAssignment = $ast.Find({ param($node) $node -is [Management.Automation.Language.AssignmentStatementAst] -and $node.Left.Extent.Text -ceq '$rows' }, $true)
if ($null -eq $copyAssignment) { throw 'Actual COPY normalization assignment not found' }
$unicode = 'a' + [char]0x00e9
$cases = @(
    @{ Name='empty table'; Copy=''; Rows=[string[]]@(); Hash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    @{ Name='one empty field'; Copy="`n"; Rows=[string[]]@(''); Hash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    @{ Name='scalar row LF'; Copy="a`n"; Rows=[string[]]@('a'); Hash='ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb' },
    @{ Name='scalar row CRLF'; Copy="a`r`n"; Rows=[string[]]@('a'); Hash='ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb' },
    @{ Name='multiple rows CRLF'; Copy="b`r`na`r`n"; Rows=[string[]]@('a','b'); Hash='7e18f737311b2dc3b2f269dd78396b0351f14fb66efa879f768cb23181883c78' }
)
foreach ($case in $cases) {
    $restoredCopy = $case.Copy
    Invoke-Expression $copyAssignment.Extent.Text
    if ((Rows-Hash $rows) -cne $case.Hash -or (Rows-Hash $case.Rows) -cne $case.Hash) { throw ('Hash mismatch: ' + $case.Name) }
    Write-Host ('PASS: ' + $case.Name)
}
$restoredCopy = $unicode + "`r`n"
Invoke-Expression $copyAssignment.Extent.Text
if ((Rows-Hash $rows) -cne (Rows-Hash ([string[]]@($unicode)))) { throw 'Unicode COPY mismatch' }
Write-Host ('PASS: Unicode normalization; PowerShell ' + $PSVersionTable.PSVersion)
