#requires -Version 5.1
<# Owner-run local recovery check. No production connection, cleanup/reset or fake Auth objects.
   Creates a unique disposable database on loopback port 5433 only; never reuses an old restore. A successful run is PARTIAL, not hosted recovery.
   Raw pg_restore/psql output stays in memory and is never printed or written to a log. #>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$ArchivePath,
    [string]$ValidationReportPath,
    [string]$PgBin = 'C:\Program Files\PostgreSQL\17\bin')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:Stage = 'initialisation'
$script:LocalPassword = $null
$archive = $ArchivePath
$script:TargetDatabase = 'esa_restore_' + [guid]::NewGuid().ToString('N')
# No host/port/database/connection-string parameter or environment override exists.
$script:Connection = 'host=localhost hostaddr=127.0.0.1 port=5433 dbname=postgres user=postgres connect_timeout=5 sslmode=disable gssencmode=disable'
$report = [ordered]@{
    status = 'FAIL'; applicationChecks = 'NOT RUN'; target = ('localhost:5433/' + $script:TargetDatabase)
    scope = 'Local application-data recovery; NOT a full Supabase restoration'
    archiveBytes = 0; archiveSha256 = $null; archiveUnchanged = $false
    managedDependencies = @(); tableCounts = [ordered]@{}; recoveredObjects = [ordered]@{}; checks = @(); excludedArchiveEntries = 0
    limitations = @(
        'All archived public and v52_staging_private tables plus actual auth.users/auth.identities, supported types/sequences/constraints/indexes and archived Auth helpers are in scope.',
        'Other Auth tables/services, managed schemas/extensions (including Vault), triggers, RLS policies, ownership and grants are excluded; no placeholders are created.',
        'RLS enable flags are retained where archived, but production roles/policies/permissions are NOT verified. Local ownership differs.',
        'Vault is excluded; its usage/contents and recovery are NOT verified. No zero-secret assumption is made.',
        'Hosted Auth login/password verification, JWT/AMR, API/RPC behaviour, email, external settings, Storage bytes and Vault recovery are NOT verified.',
        'Counts are checked against this archive, not against live production. Source maintenance/snapshot coverage and encryption copies are owner-reported, not certified here.'
    )
    reason = $null; failureCode = $null; validationPosition = 0; readOnlyValidation = [bool]$ValidationReportPath; completedUtc = $null
}
$work = $null; $exitCode = 1
function Quote-NativeArgument([string]$Value) {
    # CommandLineToArgvW-compatible quoting, also usable by .NET on Linux in fictional tests.
    $escaped = [regex]::Replace($Value, '(\\*)"', '$1$1\"')
    $escaped = [regex]::Replace($escaped, '(\\+)$', '$1$1')
    return '"' + $escaped + '"'
}
function Invoke-Pg([string]$Tool, [string[]]$Arguments) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = Join-Path $PgBin ($Tool + '.exe')
    $psi.Arguments = (($Arguments | ForEach-Object { Quote-NativeArgument $_ }) -join ' ')
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $psi.StandardErrorEncoding = New-Object System.Text.UTF8Encoding($false)
    # Strip inherited libpq service/host/password/options settings. The child gets only our password
    # and fixed encoding/timeouts. Never set the parent process's PGPASSWORD.
    foreach ($key in @($psi.EnvironmentVariables.Keys)) {
        if ([string]$key -like 'PG*') { $psi.EnvironmentVariables.Remove([string]$key) }
    }
    $psi.EnvironmentVariables['PGPASSWORD'] = $script:LocalPassword
    $psi.EnvironmentVariables['PGCLIENTENCODING'] = 'UTF8'
    $psi.EnvironmentVariables['PGOPTIONS'] = '-c statement_timeout=120000 -c lock_timeout=5000 -c timezone=UTC -c datestyle=ISO,YMD -c intervalstyle=postgres -c extra_float_digits=3 -c bytea_output=hex'
    if ($ValidationReportPath) { $psi.EnvironmentVariables['PGOPTIONS'] += ' -c default_transaction_read_only=on' }
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    try {
        [void]$p.Start()
        $stdout = $p.StandardOutput.ReadToEndAsync(); $stderr = $p.StandardError.ReadToEndAsync()
        if (-not $p.WaitForExit(180000)) { $p.Kill(); throw 'Native command timeout' }
        $p.WaitForExit()
        $out = $stdout.Result; $err = $stderr.Result
        if ($p.ExitCode -ne 0) {
            if ($err -match '(?i)(type|schema|function|relation|extension|role).*(does not exist|not available)') {
                $script:Stage += ' - unsupported archived dependency; no placeholder created'
            } elseif ($err -match '(?i)(violates|invalid input|COPY.*error)') {
                $script:Stage += ' - archive integrity/constraint failure'
            }
            throw 'Native command failed; sensitive diagnostics suppressed'
        }
        # Notices/warnings are not silently accepted. Version output has no stderr.
        if (-not [string]::IsNullOrWhiteSpace($err)) { throw 'Native command produced diagnostics; sensitive text suppressed' }
        return $out
    } finally { $p.Dispose() }
}
function Query([string]$Sql) {
    return (Invoke-Pg 'psql' @('-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=terse',
        '--dbname', $script:Connection, '--command', $Sql)).Trim()
}
function Assert-LocalTarget([string]$ExpectedDatabase = $script:TargetDatabase) {
    $state = Query @'
select json_build_object('db',current_database(),'port',inet_server_port(),
 'address',host(inet_server_addr()),'version',current_setting('server_version_num')::int,
 'recovery',pg_is_in_recovery(),'user',current_user);
'@ | ConvertFrom-Json
    if ($state.db -cne $ExpectedDatabase -or $state.port -ne 5433 -or
        $state.address -notin @('127.0.0.1','::1') -or $state.version -lt 170000 -or
        $state.version -ge 180000 -or $state.recovery -or $state.user -cne 'postgres') {
        throw 'Local target identity refused'
    }
}
function Selected-Table([string]$Schema, [string]$Name) { return $script:Tables -contains ($Schema + '.' + $Name) }
function Rows-Hash([string[]]$Rows) {
    $ordered = [string[]]@($Rows)
    [Array]::Sort($ordered, [StringComparer]::Ordinal)
    $bytes = [Text.Encoding]::UTF8.GetBytes(($ordered -join "`n"))
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Safe-Name([string]$Name) { return $Name -cmatch '^[a-z_][a-z0-9_]*$' }
try {
    $script:Stage = 'Check PostgreSQL 17 tools and explicit private archive path'
    if ($archive -notmatch '^[A-Za-z]:\\' -or $archive -match '[\r\n]') { throw 'Local absolute Windows archive path required' }
    foreach ($tool in @('psql','pg_restore')) {
        if (-not (Test-Path -LiteralPath (Join-Path $PgBin ($tool + '.exe')) -PathType Leaf)) { throw 'Missing PostgreSQL tool' }
        if ((Invoke-Pg $tool @('--version')) -notmatch '\(PostgreSQL\) 17\.') { throw 'PostgreSQL 17 tools required' }
    }
    if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) { throw 'Specified backup path not found' }
    $archive = (Get-Item -LiteralPath $archive).FullName
    $report.archiveBytes = (Get-Item -LiteralPath $archive).Length
    if ($report.archiveBytes -lt 1) { throw 'Archive empty' }
    $report.archiveSha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ValidationReportPath) {
        $script:Stage = 'Verify private earlier report and matching unchanged archive'
        $earlier = Get-Content -LiteralPath $ValidationReportPath -Raw | ConvertFrom-Json
        if ((Get-Item -LiteralPath $ValidationReportPath).DirectoryName -cne (Get-Item -LiteralPath $archive).DirectoryName -or
            $earlier.target -cnotmatch '^localhost:5433/(esa_restore_[a-f0-9]{32})$' -or
            $earlier.archiveSha256 -cne $report.archiveSha256 -or $earlier.archiveUnchanged -ne $true -or
            @($earlier.checks | Where-Object { $_ -ceq 'PASS: selected original definitions/data restored in one error-stopping transaction; local copy restricted to its owner' }).Count -ne 1) {
            throw 'Earlier report does not identify this archive and completed local restore'
        }
        # Re-read the regex after other property checks; never accept a supplied endpoint.
        [void]($earlier.target -cmatch '^localhost:5433/(esa_restore_[a-f0-9]{32})$')
        $script:TargetDatabase = $Matches[1]
        $report.target = $earlier.target
    }
    $work = Join-Path (Split-Path $archive) ('restore-check-' + [guid]::NewGuid().ToString('N'))
    [void](New-Item -ItemType Directory -Path $work)
    $script:Stage = 'Verify local PostgreSQL and create a new private recovery database'
    $secret = Read-Host 'Local PostgreSQL postgres password (NOT your Supabase password)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $script:LocalPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr); $secret.Dispose() }
    if (-not $ValidationReportPath) {
    Assert-LocalTarget 'postgres'
    if ($script:TargetDatabase -cnotmatch '^esa_restore_[a-f0-9]{32}$') { throw 'Invalid generated recovery database' }
    [void](Query ('create database ' + $script:TargetDatabase + ' template template0;'))
    [void](Query ('revoke connect,temporary on database ' + $script:TargetDatabase + ' from public;'))
    $script:Connection = $script:Connection.Replace('dbname=postgres ', ('dbname=' + $script:TargetDatabase + ' '))
    Assert-LocalTarget
    $empty = Query @'
select not exists (
 select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname !~ '^pg_' and n.nspname <> 'information_schema')
 and not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname !~ '^pg_' and n.nspname <> 'information_schema')
 and not exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
 where n.nspname !~ '^pg_' and n.nspname <> 'information_schema')
 and not exists(select 1 from pg_namespace where nspname not in ('public','information_schema') and nspname !~ '^pg_')
 and not exists(select 1 from pg_extension where extname <> 'plpgsql')
 and not exists(select 1 from pg_default_acl)
 and not exists(select 1 from pg_event_trigger)
 and not exists(select 1 from pg_foreign_server)
 and not exists(select 1 from pg_publication)
 and not exists(select 1 from pg_subscription where subdbid=(select oid from pg_database where datname=current_database()));
'@
    if ($empty -ne 't') { throw 'Destination not empty; nothing will be dropped or overwritten' }
    [void](Query ('revoke connect,temporary on database ' + $script:TargetDatabase + ' from public; select 1;'))
    $report.checks += 'PASS: loopback connection/server address, PostgreSQL 17, exact authorised empty database; PUBLIC connection access revoked locally'
    } else {
        $script:Connection = $script:Connection.Replace('dbname=postgres ', ('dbname=' + $script:TargetDatabase + ' '))
        Assert-LocalTarget
        if ((Query "select current_setting('transaction_read_only');") -cne 'on') { throw 'Read-only validation required' }
        $report.checks += 'PASS: existing restore target and archive matched; all database commands forced read-only'
    }
    $script:Stage = 'Inspect archive and select only supported recovery objects'
    $toc = Invoke-Pg 'pg_restore' @('--list', $archive)
    $entries = @()
    foreach ($line in ($toc -split "`r?`n")) {
        if ($line -match '^\d+;\s+\d+\s+\d+\s+(SEQUENCE OWNED BY|SEQUENCE SET|TABLE DATA|FK CONSTRAINT|ROW SECURITY|SCHEMA|EXTENSION|TABLE|SEQUENCE|CONSTRAINT|INDEX|TYPE|FUNCTION)\s+(.+)$') {
            $kind=$Matches[1]; $tail=$Matches[2]; $tokens=$tail -split '\s+'
            $entries += [pscustomobject]@{Line=$line; Kind=$kind; Schema=$tokens[0]; Name=$tokens[1]; Tail=$tail}
        }
    }
    $applicationSchemas = @('public','v52_staging_private')
    $script:Tables = @($entries | Where-Object { $_.Kind -eq 'TABLE' -and $_.Schema -in $applicationSchemas } | ForEach-Object {
        if (-not (Safe-Name $_.Name)) { throw 'Unsupported application table identifier' }
        $_.Schema + '.' + $_.Name
    }) + @('auth.users','auth.identities')
    $required = @('maths_families','v3_environment','v3_pins','v3_unlocks','v3_progress',
        'v3_wallet','v3_catalog','v3_transactions','v3_game_resets','v3_game_requests')
    foreach ($name in $required) {
        if ($script:Tables -notcontains ('public.'+$name)) { throw 'Current game recovery table missing' }
    }
    foreach ($table in $script:Tables) {
        $parts=$table.Split('.')
        foreach ($kind in @('TABLE','TABLE DATA')) {
            if (@($entries | Where-Object { $_.Kind -eq $kind -and $_.Schema -eq $parts[0] -and $_.Name -eq $parts[1] }).Count -ne 1) {
                throw 'Required archived table or data entry absent/ambiguous'
            }
        }
    }
    if (@($entries | Where-Object { $_.Kind -eq 'SCHEMA' -and $_.Name -eq 'auth' }).Count -ne 1) { throw 'Actual archived auth schema is required' }
    $ddl = Invoke-Pg 'pg_restore' @('--schema-only','--no-owner','--no-privileges','--no-comments',
        '--schema=public','--schema=auth','--schema=v52_staging_private','--file=-',$archive)
    # Map indexes and owned/identity sequences from actual archived DDL; do not guess their names.
    $indexTables=@{}; $sequenceTables=@{}
    $id='"?([a-z_][a-z0-9_]*)"?'
    foreach ($m in [regex]::Matches($ddl, ('CREATE (?:UNIQUE )?INDEX '+$id+' ON (?:ONLY )?'+$id+'\.'+$id))) {
        $indexTables[$m.Groups[2].Value+'.'+$m.Groups[1].Value]=$m.Groups[2].Value+'.'+$m.Groups[3].Value
    }
    foreach ($m in [regex]::Matches($ddl, ('ALTER SEQUENCE '+$id+'\.'+$id+' OWNED BY '+$id+'\.'+$id+'\.'))) {
        $sequenceTables[$m.Groups[1].Value+'.'+$m.Groups[2].Value]=$m.Groups[3].Value+'.'+$m.Groups[4].Value
    }
    foreach ($m in [regex]::Matches($ddl, ('ALTER TABLE (?:ONLY )?'+$id+'\.'+$id+' ALTER COLUMN '+$id+' ADD GENERATED (?:ALWAYS|BY DEFAULT) AS IDENTITY\s*\(\s*SEQUENCE NAME '+$id+'\.'+$id))) {
        $sequenceTables[$m.Groups[4].Value+'.'+$m.Groups[5].Value]=$m.Groups[1].Value+'.'+$m.Groups[2].Value
    }
    $available = @((Query 'select name from pg_available_extensions order by name;') -split "`r?`n")
    $supportedExtensions=@('pgcrypto','uuid-ossp','citext') # plpgsql is already part of the required empty PG17 database
    foreach ($e in @($entries | Where-Object { $_.Kind -eq 'EXTENSION' })) {
        if ($e.Name -in @('supabase_vault','pgsodium','pg_net','pg_graphql','pgjwt')) {
            $report.managedDependencies += [ordered]@{name=$e.Name; locallyAvailable=($e.Name -in $available); restored=$false}
        }
    }
    $selected=@()
    foreach ($e in $entries) {
        $yes=$false; $key=$e.Schema+'.'+$e.Name
        switch ($e.Kind) {
            'SCHEMA' { $yes=$e.Name -in @('auth','extensions','v52_staging_private') }
            'EXTENSION' { $yes=$e.Name -in $supportedExtensions -and $e.Name -in $available }
            'TYPE' { $yes=$e.Schema -in @('auth','public','v52_staging_private') -and (Safe-Name $e.Name) }
            'TABLE' { $yes=Selected-Table $e.Schema $e.Name }
            'TABLE DATA' { $yes=Selected-Table $e.Schema $e.Name }
            'ROW SECURITY' { $yes=Selected-Table $e.Schema $e.Name }
            'CONSTRAINT' { $yes=Selected-Table $e.Schema $e.Name }
            'FK CONSTRAINT' { $yes=Selected-Table $e.Schema $e.Name }
            'INDEX' { $yes=$indexTables.ContainsKey($key) -and $script:Tables -contains $indexTables[$key] }
            { $_ -in @('SEQUENCE','SEQUENCE OWNED BY','SEQUENCE SET') } {
                $yes=$sequenceTables.ContainsKey($key) -and $script:Tables -contains $sequenceTables[$key]
            }
            'FUNCTION' {
                $yes=$e.Tail -match '^auth (uid|jwt|role|email)\(\)\s+\S+$'
            }
        }
        if ($yes) { $selected += $e }
    }
    # Explicit exclusions: all other managed objects, policies, ACLs, triggers and event triggers.
    # No dummy extension, auth table, function, role or missing dependency is ever manufactured.
    $total=@($toc -split "`r?`n" | Where-Object { $_ -match '^\d+;' }).Count
    $report.excludedArchiveEntries=$total-$selected.Count
    $list=Join-Path $work 'supported.list'; $dataList=Join-Path $work 'data.list'
    [IO.File]::WriteAllLines($list,[string[]]@($selected | ForEach-Object { $_.Line }))
    [IO.File]::WriteAllLines($dataList,[string[]]@($selected | Where-Object { $_.Kind -in @('TABLE DATA','SEQUENCE SET') } | ForEach-Object { $_.Line }))
    $script:Stage = 'Read archive COPY row counts without displaying records'
    $data = Invoke-Pg 'pg_restore' @('--data-only','--use-list',$dataList,'--file=-',$archive)
    $sourceCounts=@{}; $sequenceStates=@{}; $copyTable=$null; $sourceRows=@{}; $copyColumns=@{}
    foreach ($line in ($data -split "`r?`n")) {
        if ($null -ne $copyTable) {
            if ($line -ceq '\.') { $copyTable=$null } else { $sourceCounts[$copyTable]++; $sourceRows[$copyTable].Add($line) }
        } elseif ($line -match ('^COPY '+$id+'\.'+$id+' \((.+)\) FROM stdin;$')) {
            $copyTable=$Matches[1]+'.'+$Matches[2]
            if ($script:Tables -notcontains $copyTable -or $sourceCounts.ContainsKey($copyTable)) { throw 'Unexpected COPY stream' }
            $sourceCounts[$copyTable]=[long]0
            $copyColumns[$copyTable]=$Matches[3]
            if ($copyColumns[$copyTable] -cnotmatch '^"?[a-z_][a-z0-9_]*"?(, "?[a-z_][a-z0-9_]*"?)*$') { throw 'Unsupported COPY column identifiers' }
            $sourceRows[$copyTable]=New-Object 'System.Collections.Generic.List[string]'
        } elseif ($line -match "^SELECT pg_catalog.setval\('([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)', ([0-9]+), (true|false)\);$") {
            $sequenceStates[$Matches[1]+'.'+$Matches[2]]=$Matches[3]+'|'+$Matches[4]
        } elseif ($line -match '^INSERT INTO ') { throw 'INSERT-mode dump unsupported; no data restored' }
    }
    $data=$null; $ddl=$null
    if ($null -ne $copyTable -or $sourceCounts.Count -ne $script:Tables.Count) { throw 'Incomplete archive COPY inventory' }
    if ($sourceCounts['public.maths_families'] -lt 1 -or $sourceCounts['auth.users'] -lt 2) { throw 'Existing family/account records absent from archive' }
    foreach ($table in $script:Tables) { $sourceRows[$table] = Rows-Hash $sourceRows[$table].ToArray() }
    if (-not $ValidationReportPath) {
    $script:Stage = 'Restore selected objects atomically (missing dependencies abort; no raw errors logged)'
    Assert-LocalTarget
    [void](Invoke-Pg 'pg_restore' @('--exit-on-error','--single-transaction','--no-owner','--no-privileges',
        '--no-tablespaces','--no-security-labels','--no-comments','--use-list',$list,
        '--dbname',$script:Connection,$archive))
    [void](Query 'revoke all on schema public,auth from public; revoke all on all tables in schema public,auth from public; revoke execute on all functions in schema public,auth from public; select 1;')
    if ((Query "select exists(select 1 from pg_namespace where nspname='v52_staging_private');") -eq 't') {
        [void](Query 'revoke all on schema v52_staging_private from public; revoke all on all tables in schema v52_staging_private from public; select 1;')
    }
    $report.checks += 'PASS: selected original definitions/data restored in one error-stopping transaction; local copy restricted to its owner'
    }
    $script:Stage = 'Validate recovered counts, constraints, indexes, sequences and family relationships'
    Assert-LocalTarget
    foreach ($table in $script:Tables) {
        $report.validationPosition++
        $script:Stage = 'Validate table row count (position ' + $report.validationPosition + ')'
        $actual=[long](Query ('select count(*) from '+$table+';'))
        if ($actual -ne $sourceCounts[$table]) { throw 'Archive/restored count mismatch' }
        $script:Stage = 'Validate table COPY content (position ' + $report.validationPosition + ')'
        $restoredCopy = Invoke-Pg 'psql' @('-X','-w','-q','-v','ON_ERROR_STOP=1','--dbname',$script:Connection,
            '--command', ('COPY ' + $table + ' (' + $copyColumns[$table] + ') TO STDOUT;'))
        $rows = if ($restoredCopy.Length -eq 0) { @() } else { @($restoredCopy.Substring(0,$restoredCopy.Length-1) -split "`n" | ForEach-Object { $_.TrimEnd([char]13) }) }
        if ((Rows-Hash $rows) -cne $sourceRows[$table]) { throw 'Archive/restored content digest mismatch; stop for private operator review' }
        $restoredCopy=$null; $rows=$null
        $report.tableCounts[$table]=$actual
    }
    $script:Stage = 'Validate restored constraint states'
    $tableLiterals=($script:Tables | ForEach-Object { "'"+$_+"'::regclass" }) -join ','
    if ((Query "select count(*) from pg_constraint where conrelid in ($tableLiterals) and not convalidated;") -ne '0') { throw 'Unvalidated constraint' }
    $script:Stage = 'Validate archived constraint names and definitions'
    foreach ($e in @($selected | Where-Object { $_.Kind -in @('CONSTRAINT','FK CONSTRAINT') })) {
        $tokens=$e.Tail -split '\s+'; $constraint=$tokens[2]
        if (-not (Safe-Name $constraint)) { throw 'Unsupported quoted constraint identifier' }
        if ((Query "select count(*) from pg_constraint where conrelid='$($e.Schema).$($e.Name)'::regclass and conname='$constraint' and convalidated;") -ne '1') { throw 'Constraint missing after restore' }
    }
    $script:Stage = 'Validate restored indexes'
    foreach ($e in @($selected | Where-Object { $_.Kind -eq 'INDEX' })) {
        if (-not (Safe-Name $e.Name)) { throw 'Unsupported index identifier' }
        if ((Query "select count(*) from pg_index where indexrelid='$($e.Schema).$($e.Name)'::regclass and indisvalid and indisready;") -ne '1') { throw 'Invalid/missing index' }
    }
    $script:Stage = 'Validate restored sequence states'
    foreach ($e in @($selected | Where-Object { $_.Kind -eq 'SEQUENCE' })) {
        $key=$e.Schema+'.'+$e.Name
        if (-not (Safe-Name $e.Name)) { throw 'Unsupported sequence identifier' }
        if ((Query "select count(*) from pg_class where oid='$key'::regclass and relkind='S';") -ne '1') { throw 'Missing sequence' }
        if (-not $sequenceStates.ContainsKey($key) -or
            (Query ("select last_value::text||'|'||is_called::text from "+$key+';')) -cne $sequenceStates[$key]) { throw 'Sequence state mismatch' }
    }
    $script:Stage = 'Validate recovered current-game project identity'
    if ((Query "select count(*) from public.v3_environment where project_ref='sfogrvedypgtxfvecmbx' and name='jaxon-maths-v3-staging';") -ne '1' -or
        (Query 'select count(*) from public.v3_environment;') -ne '1') { throw 'Current family game project identity mismatch' }
    if ((Query "select count(*) from information_schema.columns where table_schema='public' and table_name='v3_progress' and column_name='game_epoch';") -ne '1') { throw 'Reset-generation column absent' }
    $script:Stage = 'Validate family and Auth identity links'
    $orphans=Query @'
select count(*) from public.maths_families f left join auth.users p on p.id=f.parent_user_id
 left join auth.users c on c.id=f.child_user_id
 where p.id is null or c.id is null or f.parent_user_id=f.child_user_id;
'@
    if ($orphans -ne '0') { throw 'Broken Auth/family relationship' }
    if ($script:Tables -contains 'auth.identities') {
        if ((Query 'select count(*) from auth.identities i left join auth.users u on u.id=i.user_id where u.id is null;') -ne '0') { throw 'Broken archived identity link' }
    }
    $report.checks += 'PASS: every selected table count and sorted COPY-content SHA256 equals archive; current project/reset generation verified; restored constraints/indexes/sequences checked; no orphaned account/family/game links'
    foreach ($kind in @('TABLE','TYPE','FUNCTION','CONSTRAINT','FK CONSTRAINT','INDEX','SEQUENCE','ROW SECURITY')) {
        $report.recoveredObjects[$kind]=@($selected | Where-Object { $_.Kind -eq $kind }).Count
    }
    $report.status='PARTIAL'; $report.applicationChecks='PASS'; $exitCode=0
} catch {
    # Map only fixed verifier-owned messages, never expose arbitrary native/COPY errors.
    $codes = @{
        'Archive/restored count mismatch' = 'ROW_COUNT_MISMATCH'
        'Archive/restored content digest mismatch; stop for private operator review' = 'COPY_CONTENT_MISMATCH'
        'Unvalidated constraint' = 'CONSTRAINT_NOT_VALIDATED'
        'Unsupported quoted constraint identifier' = 'CONSTRAINT_IDENTIFIER_UNSUPPORTED'
        'Constraint missing after restore' = 'CONSTRAINT_MISSING'
        'Unsupported index identifier' = 'INDEX_IDENTIFIER_UNSUPPORTED'
        'Invalid/missing index' = 'INDEX_INVALID_OR_MISSING'
        'Unsupported sequence identifier' = 'SEQUENCE_IDENTIFIER_UNSUPPORTED'
        'Missing sequence' = 'SEQUENCE_MISSING'
        'Sequence state mismatch' = 'SEQUENCE_STATE_MISMATCH'
        'Current family game project identity mismatch' = 'PROJECT_IDENTITY_MISMATCH'
        'Reset-generation column absent' = 'RESET_COLUMN_MISSING'
        'Broken Auth/family relationship' = 'FAMILY_LINK_MISMATCH'
        'Broken archived identity link' = 'AUTH_IDENTITY_LINK_MISMATCH'
        'Earlier report does not identify this archive and completed local restore' = 'EARLIER_REPORT_MISMATCH'
        'Read-only validation required' = 'READ_ONLY_GUARD_FAILED'
        'Native command failed; sensitive diagnostics suppressed' = 'NATIVE_TOOL_FAILED'
        'Native command produced diagnostics; sensitive text suppressed' = 'NATIVE_TOOL_DIAGNOSTICS'
        'Native command timeout' = 'NATIVE_TOOL_TIMEOUT'
    }
    $message = [string]$_.Exception.Message
    $report.failureCode = if ($codes.ContainsKey($message)) { $codes[$message] }
        elseif ($_.FullyQualifiedErrorId -match 'PropertyNotFound') { 'POWERSHELL_PROPERTY_ERROR' }
        elseif ($_.FullyQualifiedErrorId -match 'MethodNotFound|InvokeMethodOnNull|MethodInvocation') { 'POWERSHELL_METHOD_ERROR' }
        elseif ($_.FullyQualifiedErrorId -match 'ParameterBinding|ArgumentTransformation') { 'POWERSHELL_ARGUMENT_ERROR' }
        else { 'VERIFIER_ERROR_DETAILS_PRIVATE' }
    $report.reason=$script:Stage
    $report.status='FAIL'; $report.applicationChecks='FAIL'; $exitCode=1
} finally {
    $script:LocalPassword=$null
    if ($report.archiveSha256) {
        try { $report.archiveUnchanged=((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $report.archiveSha256) }
        catch { $report.archiveUnchanged=$false }
        if (-not $report.archiveUnchanged) { $report.status='FAIL'; $report.reason='Backup integrity changed/unreadable'; $exitCode=1 }
    }
    if ($work -and (Test-Path -LiteralPath $work)) { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
    $report.completedUtc=[DateTime]::UtcNow.ToString('o')
    try {
        $reportPath=Join-Path (Split-Path $archive) ('current-game-restore-report-'+[guid]::NewGuid().ToString('N')+'.json')
        $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportPath -Encoding UTF8
    } catch { $reportPath=$null; $report.status='FAIL'; $report.reason=([string]$report.reason+'; could not save private summary report'); $exitCode=1 }
    Write-Host ($report.status+': application recovery checks '+$report.applicationChecks)
    Write-Host ('Target: localhost:5433/' + $script:TargetDatabase + '. Original archive unchanged: ' + $report.archiveUnchanged)
    if ($report.reason) { Write-Host ('Stopped at: '+$report.reason) }
    if ($report.failureCode) { Write-Host ('Diagnostic code: '+$report.failureCode) }
    if ($ValidationReportPath) { Write-Host 'Existing local restore inspected read-only; no new database or restore was created.' }
    Write-Host 'This does NOT verify complete Supabase/Auth-service recovery. See the private JSON summary for exclusions.'
    if ($reportPath) { Write-Host ('Private summary: '+$reportPath) }
    if ($exitCode -ne 0) { Write-Host 'No automatic cleanup/reset is performed. Do not paste raw database errors or records; share only this summary.' }
}
exit $exitCode
