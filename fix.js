const fs = require('fs');
const lines = fs.readFileSync('dashboard-pastor.html', 'utf8').split('\n');

// The file got messed up. Let's just extract the good parts and rebuild it correctly.
let finalHtml = [];

// 1. Read up to end of view-course (line 247)
for(let i = 0; i <= 246; i++) {
    finalHtml.push(lines[i]);
}

// 2. Add Progress Table at the end of view-course
finalHtml.push(`
                <!-- Progress Table -->
                <div class="table-card mt-3" style="margin-top:20px;">
                    <div class="flex-between mb-2">
                        <h3 class="chart-title m-0">Progreso del Curso por Miembro</h3>
                        <button class="btn-primary-solid btn-small flex-align-center gap-1" id="btn-export-pdf">
                            <span>📄</span> Exportar a PDF
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table" id="table-progress">
                            <thead>
                                <tr>
                                    <th data-sort="nombre" class="sortable">Nombre <span>↕</span></th>
                                    <th data-sort="rol" class="sortable">Rol <span>↕</span></th>
                                    <th data-sort="lider" class="sortable">Líder Asignado <span>↕</span></th>
                                    <th data-sort="modulos" class="sortable">Módulos Leídos <span>↕</span></th>
                                    <th data-sort="porcentaje" class="sortable">Porcentaje <span>↕</span></th>
                                    <th data-sort="actividad" class="sortable">Última Actividad <span>↕</span></th>
                                </tr>
                            </thead>
                            <tbody id="table-progress-body">
                                <tr><td colspan="6" class="text-center">Cargando datos...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
`);

// 3. Add the NEW view-content (Lines 442 to 477)
for(let i = 442; i <= 476; i++) {
    finalHtml.push(lines[i]);
}

// 4. Add the modals (Lines 478 to 532)
for(let i = 478; i <= 531; i++) {
    finalHtml.push(lines[i]);
}

// 5. Add scripts (Lines 533 to 545)
for(let i = 533; i <= 545; i++) {
    finalHtml.push(lines[i]);
}

fs.writeFileSync('dashboard-pastor.html', finalHtml.join('\n'), 'utf8');
console.log('File rebuilt successfully.');
