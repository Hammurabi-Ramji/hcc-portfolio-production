import { commands } from './bindings.js';
const calls = {
  recovery_pick: a => commands.recoveryPick(a.create),
  recovery_create: a => commands.recoveryCreate(a.outputDir,a.grant),
  recovery_verify: a => commands.recoveryVerify(a.directory),
  credentials_pick_source: () => commands.credentialsPickSource(),
  credentials_owners: a => commands.credentialsOwners(a.sourcePath),
  credentials_preview: a => commands.credentialsPreview(a.sourcePath,a.ownerId),
  credentials_list: () => commands.credentialsList(),
  credentials_import: a => commands.credentialsImport(a.sourcePath,a.ownerId,a.digest,a.legacyKey,a.grant),
  credentials_reveal: a => commands.credentialsReveal(a.digest,a.credentialId,a.grant),
  eduba_pick_source: () => commands.edubaPickSource(),
  eduba_pick_export: () => commands.edubaPickExport(),
  eduba_preview: a => commands.edubaPreview(a.sourcePath),
  eduba_list: () => commands.edubaList(),
  eduba_import: a => commands.edubaImport(a.sourcePath,a.digest,a.grant),
  eduba_export: a => commands.edubaExport(a.digest,a.outputPath,a.grant),
  flow_new: () => commands.flowNew(),
  flow_save: a => commands.flowSave(a.flow),
  flow_list: () => commands.flowList(),
  flow_delete: a => commands.flowDelete(a.id),
  execute_workflow: a => commands.executeWorkflow(a.grant,a.id,a.graph),
  execution_list: a => commands.executionList(a.id),
  initialize_db: () => commands.initializeDb(),
  node_schemas: () => commands.nodeSchemas(),
  nlp_send: a => commands.nlpSend(a.grant,a.request),
  generate_code: a => commands.generateCode(a.grant,a.request),
  refine_code: a => commands.refineCode(a.grant,a.request),
  file_save: a => commands.fileSave(a.grant,a.outputDir,a.file),
  wasm_fibonacci: a => commands.wasmFibonacci(a.n),
  model_control: a => commands.modelControl(a.action),
  model_scan: a => commands.modelScan(a.provider,a.base),
  model_select: a => commands.modelSelect(a.provider,a.base,a.id),
  document_list: () => commands.documentList(),
  document_save: a => commands.documentSave(a.id,a.expected,a.text),
  vector_put: a => commands.vectorPut(a.id,a.model,a.vector),
  vector_search: a => commands.vectorSearch(a.model,a.vector,a.limit),
  loopback_set: a => commands.loopbackSet(a.enabled),
  fabricator_templates: () => commands.fabricatorTemplates(),
  fabricator_generate: a => commands.fabricatorGenerate(a.grant,a.template,a.outputDir),
  execution_archive: a => commands.executionArchive(a.id,a.runId),
  vault_status: () => commands.vaultStatus(),
  vault_initialize: a => commands.vaultInitialize(a.password),
  vault_unlock: a => commands.vaultUnlock(a.password),
  vault_lock: () => commands.vaultLock(),
  vault_put: a => commands.vaultPut(a.id,a.value),
  vault_get: a => commands.vaultGet(a.id,a.grant),
  schema_entities: () => commands.schemaEntities(),
  schema_get: a => commands.schemaGet(a.entity),
  entity_list: a => commands.entityList(a.entity),
  entity_read: a => commands.entityRead(a.entity,a.id),
  entity_save: a => commands.entitySave(a.entity,a.id ?? null,a.record),
  entity_delete: a => commands.entityDelete(a.entity,a.id),
  precedent_list: () => commands.precedentList(),
  validation_pick_project: () => commands.validationPickProject(),
  validation_run: a => commands.validationRun(a.project,a.grant),
  precedent_carve: a => commands.precedentCarve(a.title,a.body,a.rationale,a.grant)
};
function operation(command,a) {
  switch(command) {
    case 'recovery_create': return {kind:'core_backup',outputDir:a.outputDir};
    case 'credentials_import': return {kind:'import_credentials',sourcePath:a.sourcePath,ownerId:a.ownerId,digest:a.digest};
    case 'credentials_reveal': return {kind:'reveal_credential',digest:a.digest,credentialId:a.credentialId};
    case 'eduba_import': return {kind:'import_eduba',sourcePath:a.sourcePath,digest:a.digest};
    case 'eduba_export': return {kind:'export_eduba',digest:a.digest,outputPath:a.outputPath};
    case 'nlp_send': return {kind:'chat',request:a.request};
    case 'generate_code': return {kind:'generate',request:a.request};
    case 'refine_code': return {kind:'refine',request:a.request};
    case 'file_save': return {kind:'save',outputDir:a.outputDir,file:a.file};
    case 'execute_workflow': return {kind:'execute',id:a.id,graph:a.graph};
    case 'fabricator_generate': return {kind:'fabricate',template:a.template,outputDir:a.outputDir};
    case 'vault_get': return {kind:'unseal',id:a.id};
    case 'precedent_carve': return {kind:'carve',title:a.title,body:a.body,rationale:a.rationale};
    case 'validation_run': return {kind:'validate',project:a.project};
    default: return null;
  }
}
export async function invokeCommand(command,args={}) {
  if (!Object.hasOwn(calls,command)) throw new Error(`Unknown native command: ${command}`);
  try {
    // Snapshot the exact operation before a native consent dialog opens.
    const snapshot=JSON.parse(JSON.stringify(args));
    const scope=operation(command,snapshot);
    if(scope) { const grant=await commands.grantRequest(scope); snapshot.grant=grant.id; }
    return await calls[command](snapshot);
  }
  catch(error) { throw new Error(error?.message || String(error)); }
}
