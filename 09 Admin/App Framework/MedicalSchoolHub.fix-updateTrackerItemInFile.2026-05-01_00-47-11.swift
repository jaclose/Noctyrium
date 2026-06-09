import SwiftUI
import AppKit

@main
struct MedicalSchoolHubApp: App {
    var body: some Scene {
        WindowGroup {
            HubView()
                .frame(minWidth: 1320, idealWidth: 1420, minHeight: 860, idealHeight: 920)
                .background(.clear)
        }
        .windowStyle(.hiddenTitleBar)
    }
}

struct Stats {
    var inbox = 0
    var downloads = 0
    var needsReview = 0
    var ankiNeeded = 0
    var summaryNeeded = 0
    var weakArea = 0
    var todayMinutes = 0
    var todayCards = 0
    var manualMinutesToday = 0
    var journalEntries = 0
    var tasksOpen = 0
    var tasksDoneToday = 0
    var bpm500 = 0
    var bpm501 = 0
    var ppm500 = 0
    var ppm501 = 0
    var ppm502 = 0
}

struct StudyLog: Identifiable {
    let id = UUID()
    let date: Date
    let type: String
    let minutes: Int
    let cards: Int
    let note: String
}

struct JournalEntry: Identifiable {
    let id = UUID()
    let date: String
    let today: String
    let tomorrow: String
    let blockers: String
    let energy: String
    let rating: String
}


struct PromptItem: Identifiable {
    let id: String
    let title: String
    let category: String
    let tags: String
    let created: String
    let updated: String
    let path: String

    var fullPath: String {
        "\(NSHomeDirectory())/Medical School/\(path)"
    }

    var preview: String {
        let raw = (try? String(contentsOfFile: fullPath)) ?? "No preview available."
        let clean = raw.replacingOccurrences(of: "\n", with: " ")
        if clean.count > 180 {
            return String(clean.prefix(180)) + "…"
        }
        return clean
    }

    var bodyText: String {
        (try? String(contentsOfFile: fullPath)) ?? ""
    }
}


struct CourseTrackerItem: Identifiable {
    let id: String
    let week: String
    let type: String
    let label: String
    let status: String
    let quality: Int
    let color: String
    let notes: String
    let updated: String
}

struct TaskItem: Identifiable {
    let id: String
    let created: String
    let due: String
    let title: String
    let status: String
    let completed: String
}

struct HubView: View {
    @State private var selected = "Dashboard"
    @State private var stats = Stats()
    @State private var logs: [StudyLog] = []
    @State private var journal: [JournalEntry] = []
    @State private var tasks: [TaskItem] = []
    @State private var trackerItems: [CourseTrackerItem] = []
    @State private var bsceItems: [CourseTrackerItem] = []
    @State private var status = "Medical School Hub online."
    @State private var refreshing = false

    @State private var standupToday = ""
    @State private var standupTomorrow = ""
    @State private var standupBlockers = ""
    @State private var standupEnergy = "Medium"
    @State private var standupRating = "Useful"

    @State private var newTask = ""

    let home = FileManager.default.homeDirectoryForCurrentUser.path

    var base: String { "\(home)/Medical School" }
    var scripts: String { "\(base)/09 Admin/Scripts" }
    var appData: String { "\(base)/09 Admin/App Data" }
    var logFile: String { "\(appData)/productivity_log.csv" }
    var taskFile: String { "\(appData)/tasks.csv" }
    var journalFile: String { "\(appData)/journal.csv" }
    var nb3TrackerFile: String { "\(appData)/Course Trackers/nb3_tracker.csv" }
    var bsceTrackerFile: String { "\(appData)/Course Trackers/bsce_t2_tracker.csv" }
    var ankiMedia: String { "\(home)/Library/Application Support/Anki2/User 1/collection.media" }

    var body: some View {
        ZStack {
            OuterBackground()

            GlassShell {
                HStack(spacing: 0) {
                    Sidebar(selected: $selected)

                    Rectangle()
                        .fill(Color.white.opacity(0.07))
                        .frame(width: 1)

                    VStack(spacing: 18) {
                        TopBar(
                            title: selected,
                            subtitle: subtitleForPage(),
                            refreshing: refreshing,
                            refreshAction: refresh
                        )

                        pageBody()
                    }
                    .padding(24)
                }
            }
            .padding(28)
        }
        .onAppear {
            ensureFiles()
            refresh()
        }
    }

    @ViewBuilder
    func pageBody() -> some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                switch selected {
                case "Dashboard":
                    DashboardPage(
                        stats: stats,
                        logs: logs,
                        runHub: { run("\"\(scripts)/run_medical_hub.sh\"", "Run Hub") },
                        sort: { run("\"\(scripts)/auto_sort_medical.sh\"", "Auto Sort") },
                        review: { run("\"\(scripts)/weekly_med_review.sh\"", "Weekly Review") },
                        openInbox: { open("\(base)/00 📥 Inbox - Need Work Look Over") },
                        openAnkiMedia: { open(ankiMedia) },
                        logLecture: { log(type: "Lecture", minutes: 50, cards: 0, note: "Lecture completed") },
                        logAnki50: { log(type: "Anki", minutes: 15, cards: 50, note: "50 cards") },
                        logAnki100: { log(type: "Anki", minutes: 30, cards: 100, note: "100 cards") },
                        logStudy60: { log(type: "Study", minutes: 60, cards: 0, note: "1 hour focused study") },
                        standupToday: $standupToday,
                        standupTomorrow: $standupTomorrow,
                        standupBlockers: $standupBlockers,
                        standupEnergy: $standupEnergy,
                        standupRating: $standupRating,
                        saveStandup: saveStandup
                    )

                case "Courses":
                    CoursesPage(stats: stats, open: openPath)

                case "Course Tracker":
                    CourseTrackerPage(
                        items: trackerItems,
                        bsceItems: bsceItems,
                        base: base,
                        open: openPath,
                        updateItem: updateTrackerItem,
                        updateBSCEItem: updateBSCETrackerItem,
                        addPractice: addPracticeItem
                    )

                case "STEP 1":
                    StepPage(stats: stats, open: openPath, ankiMedia: ankiMedia)

                case "Reports":
                    ReportsPage(stats: stats, logs: logs, status: status, open: openPath, base: base)

                case "Productivity":
                    ProductivityPage(
                        stats: stats,
                        logs: logs,
                        logLecture: { log(type: "Lecture", minutes: 50, cards: 0, note: "Lecture completed") },
                        logAnki50: { log(type: "Anki", minutes: 15, cards: 50, note: "50 cards") },
                        logAnki100: { log(type: "Anki", minutes: 30, cards: 100, note: "100 cards") },
                        logAnki150: { log(type: "Anki", minutes: 45, cards: 150, note: "150 cards") },
                        logAnki200: { log(type: "Anki", minutes: 60, cards: 200, note: "200 cards") },
                        logStudy180: { log(type: "Study", minutes: 180, cards: 0, note: "3 hour study block") }
                    )

                case "Tasks":
                    TasksPage(tasks: tasks, newTask: $newTask, addTask: addTask, completeTask: completeTask)

                case "Journal":
                    JournalPage(entries: journal, openJournalFolder: { open("\(base)/09 Admin/Journal") })

                case "Integrations":
                    IntegrationsPage(base: base, open: openPath)

                case "Prompt Library":
                    PromptPage(base: base, open: openPath)

                default:
                    HubFoldersPage(base: base, open: openPath)
                }
            }
            .padding(.bottom, 24)
        }
    }

    func subtitleForPage() -> String {
        switch selected {
        case "Courses": return "Term-based course map with module-level folders"
        case "Course Tracker": return "Lecture, DLA, and PQ completion map"
        case "Journal": return "Daily standups, review, blockers, and tomorrow’s plan"
        case "Integrations": return "Framework for Anki, ScreenTime, Calendar, and manual time correction"
        case "Productivity": return "Study time, Anki cards, lecture blocks, day usefulness"
        case "Reports": return "Visual summaries of your medical school operating system"
        default: return "A glassmorphic command center for medical school execution"
        }
    }

    func ensureFiles() {
        try? FileManager.default.createDirectory(atPath: appData, withIntermediateDirectories: true)
        if !FileManager.default.fileExists(atPath: logFile) {
            try? "date,type,minutes,cards,note\n".write(toFile: logFile, atomically: true, encoding: .utf8)
        }
        if !FileManager.default.fileExists(atPath: taskFile) {
            try? "id,created,due,title,status,completed\n".write(toFile: taskFile, atomically: true, encoding: .utf8)
        }
        if !FileManager.default.fileExists(atPath: journalFile) {
            try? "date,today,tomorrow,blockers,energy,rating\n".write(toFile: journalFile, atomically: true, encoding: .utf8)
        }
    }

    func refresh() {
        refreshing = true
        DispatchQueue.global(qos: .userInitiated).async {
            let output = shell("\"\(scripts)/dashboard_stats.sh\"")
            let s = parseStats(output)
            let l = loadLogs(logFile)
            let j = loadJournal(journalFile)
            let t = loadTasks(taskFile)
            let tracker = loadCourseTracker(nb3TrackerFile)
            let bsce = loadCourseTracker(bsceTrackerFile)

            DispatchQueue.main.async {
                stats = s
                logs = l
                journal = j
                tasks = t
                trackerItems = tracker
                bsceItems = bsce
                status = output
                refreshing = false
            }
        }
    }

    func run(_ command: String, _ label: String) {
        refreshing = true
        DispatchQueue.global(qos: .userInitiated).async {
            let out = shell(command)
            DispatchQueue.main.async {
                status = out.isEmpty ? "\(label) complete." : out
                refreshing = false
                refresh()
            }
        }
    }

    func open(_ path: String) {
        NSWorkspace.shared.open(URL(fileURLWithPath: path))
        status = "Opened: \(path)"
    }

    func openPath(_ path: String) {
        open(path)
    }

    func log(type: String, minutes: Int, cards: Int, note: String) {
        ensureFiles()
        let f = ISO8601DateFormatter()
        let safeNote = clean(note)
        append("\(f.string(from: Date())),\(type),\(minutes),\(cards),\(safeNote)\n", to: logFile)
        refresh()
    }

    func updateBSCETrackerItem(_ item: CourseTrackerItem, action: String) {
        updateTrackerItemInFile(item, action: action, filePath: bsceTrackerFile)
    }

    func updateTrackerItem(_ item: CourseTrackerItem, _ action: String) {
        ensureFiles()

        var newQuality = item.quality
        var newStatus = item.status
        var newColor = item.color
        var note = item.notes

        if action == "addPass" {
            newQuality += 1
        } else if action == "removePass" {
            newQuality = max(0, newQuality - 1)
        } else if action == "ankiPass" {
            let currentAnki = extractAnkiPasses(note)
            let nextAnki = currentAnki + 1
            note = writeAnkiPasses(note, nextAnki)
        } else if action == "ankiReset" {
            note = writeAnkiPasses(note, 0)
        } else if action == "needsWork" {
            newStatus = "needs_mastery"
            newColor = "red"
            note = preservingAnki(note, replacingMainNoteWith: "Needs mastery")
        } else if action == "mastered" {
            newQuality = max(3, newQuality)
            newStatus = "mature"
            newColor = "darkgreen"
            note = preservingAnki(note, replacingMainNoteWith: "Mature / mastered")
        } else if action == "reset" {
            newQuality = 0
            newStatus = "not_started"
            newColor = "blue"
            note = writeAnkiPasses("", extractAnkiPasses(note))
        }

        if action == "addPass" || action == "removePass" {
            if newQuality <= 0 {
                newStatus = "not_started"
                newColor = "blue"
                note = preservingAnki(note, replacingMainNoteWith: "Not started")
            } else if newQuality == 1 {
                newStatus = "needs_mastery"
                newColor = "red"
                note = preservingAnki(note, replacingMainNoteWith: "Needs mastery")
            } else if newQuality == 2 {
                newStatus = "young"
                newColor = "lightgreen"
                note = preservingAnki(note, replacingMainNoteWith: "Young")
            } else {
                newStatus = "mature"
                newColor = "darkgreen"
                note = preservingAnki(note, replacingMainNoteWith: "Mature")
            }
        }

        rewriteTrackerItem(
            id: item.id,
            status: newStatus,
            quality: newQuality,
            color: newColor,
            notes: note
        )

        let minutes = action == "ankiPass" ? 12 : item.type.lowercased() == "lecture" ? 35 : item.type.lowercased() == "dla" ? 25 : 15
        let eventType = action == "ankiPass" ? "Anki" : item.type.lowercased() == "lecture" ? "Lecture" : item.type.lowercased() == "dla" ? "DLA" : "Practice"
        let ankiText = action == "ankiPass" ? " / Anki \(extractAnkiPasses(note))" : ""
        log(type: eventType, minutes: minutes, cards: action == "ankiPass" ? 25 : 0, note: "\(item.label) → \(newStatus) / \(newQuality) passes\(ankiText)")
    }

    func addPracticeItem(_ practiceType: String, _ title: String, _ questionCount: String, _ score: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return }

        let count = Int(questionCount.trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
        let grade = score.uppercased()

        let color: String
        let status: String

        switch grade {
        case "A":
            color = "darkgreen"
            status = "mature"
        case "B":
            color = "lightgreen"
            status = "young"
        case "C":
            color = "orange"
            status = "shaky"
        case "D", "F":
            color = "red"
            status = "needs_mastery"
        default:
            color = "blue"
            status = "not_started"
        }

        let id = "\(practiceType.uppercased())-\(Int(Date().timeIntervalSince1970))"
        let now = ISO8601DateFormatter().string(from: Date())
        let safeTitle = clean(trimmed)
        let line = "\(id),Week Custom,\(practiceType),\(safeTitle),\(status),\(count),\(color),Score \(grade),\(now)\n"

        append(line, to: nb3TrackerFile)
        log(type: "Practice", minutes: max(10, count), cards: 0, note: "\(practiceType): \(trimmed) • \(count) questions • \(grade)")
        refresh()
    }

    func rewriteTrackerItem(id: String, status: String, quality: Int, color: String, notes: String) {
        guard let raw = try? String(contentsOfFile: nb3TrackerFile) else { return }

        let lines = raw.components(separatedBy: .newlines)
        var output: [String] = []

        for line in lines {
            if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { continue }

            if line.hasPrefix("id,") {
                output.append(line)
                continue
            }

            let parts = parseCSVLine(line)
            if parts.count >= 9 && parts[0] == id {
                let updated = ISO8601DateFormatter().string(from: Date())
                output.append("\(parts[0]),\(parts[1]),\(parts[2]),\(clean(parts[3])),\(status),\(quality),\(color),\(clean(notes)),\(updated)")
            } else {
                output.append(line)
            }
        }

        try? output.joined(separator: "\n").appending("\n").write(toFile: nb3TrackerFile, atomically: true, encoding: .utf8)
        refresh()
    }


    func saveStandup() {
        ensureFiles()
        let f = ISO8601DateFormatter()
        let line = "\(f.string(from: Date())),\(clean(standupToday)),\(clean(standupTomorrow)),\(clean(standupBlockers)),\(standupEnergy),\(standupRating)\n"
        append(line, to: journalFile)

        try? FileManager.default.createDirectory(atPath: "\(base)/09 Admin/Journal", withIntermediateDirectories: true)
        let readable = """
        # Daily Standup

        Date: \(Date())

        ## What I did today
        \(standupToday)

        ## What I will do tomorrow
        \(standupTomorrow)

        ## Blockers
        \(standupBlockers)

        ## Energy
        \(standupEnergy)

        ## Rating
        \(standupRating)
        """
        let fileName = "\(base)/09 Admin/Journal/Standup - \(DateFormatter.fileSafe.string(from: Date())).md"
        try? readable.write(toFile: fileName, atomically: true, encoding: .utf8)

        standupToday = ""
        standupTomorrow = ""
        standupBlockers = ""
        standupEnergy = "Medium"
        standupRating = "Useful"

        log(type: "Journal", minutes: 5, cards: 0, note: "Daily standup")
        refresh()
    }

    func addTask() {
        let trimmed = newTask.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let f = ISO8601DateFormatter()
        let id = UUID().uuidString
        let now = f.string(from: Date())
        append("\(id),\(now),\(now),\(clean(trimmed)),open,\n", to: taskFile)
        newTask = ""
        refresh()
    }

    func updateTrackerItem(id: String, passDelta: Int? = nil, setStatus: String? = nil, setColor: String? = nil, note: String? = nil) {
        guard let raw = try? String(contentsOfFile: nb3TrackerFile) else { return }
        var lines = raw.components(separatedBy: .newlines).filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guard !lines.isEmpty else { return }

        let now = DateFormatter.shortDate.string(from: Date())
        var updated: [String] = [lines[0]]

        for line in lines.dropFirst() {
            var p = parseCSVLine(line)
            while p.count < 9 { p.append("") }

            if p[0] == id {
                var q = Int(p[5]) ?? 0
                if let passDelta = passDelta {
                    q = max(0, min(4, q + passDelta))
                    p[5] = "\(q)"
                    if q == 0 {
                        p[4] = "not_started"
                        p[6] = "gray"
                    } else if q == 1 {
                        p[4] = "pass_1"
                        p[6] = "red"
                    } else if q == 2 {
                        p[4] = "pass_2"
                        p[6] = "orange"
                    } else if q == 3 {
                        p[4] = "completed"
                        p[6] = "green"
                    } else {
                        p[4] = "mastered"
                        p[6] = "blue"
                    }
                }

                if let setStatus = setStatus { p[4] = setStatus }
                if let setColor = setColor { p[6] = setColor }
                if let note = note { p[7] = clean(note) }
                p[8] = now
            }

            updated.append(p.map { clean($0) }.joined(separator: ","))
        }

        try? updated.joined(separator: "\n").appending("\n").write(toFile: nb3TrackerFile, atomically: true, encoding: .utf8)
        refresh()
    }

    func addTrackerItem(type: String, label: String, week: String = "Custom", notes: String = "") {
        let trimmed = label.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let now = DateFormatter.shortDate.string(from: Date())
        let id = "\(type.uppercased().replacingOccurrences(of: " ", with: ""))-\(Int(Date().timeIntervalSince1970))"
        let line = "\(id),\(week),\(type),\(clean(trimmed)),not_started,0,gray,\(clean(notes)),\(now)"
        append(line, to: nb3TrackerFile)
        refresh()
    }



    func completeTask(_ task: TaskItem) {
        guard let text = try? String(contentsOfFile: taskFile) else { return }
        let now = ISO8601DateFormatter().string(from: Date())
        let lines = text.split(separator: "\n").map(String.init)
        let updated = lines.map { line -> String in
            if line.hasPrefix(task.id + ",") {
                let p = line.split(separator: ",", omittingEmptySubsequences: false).map(String.init)
                if p.count >= 6 { return "\(p[0]),\(p[1]),\(p[2]),\(p[3]),done,\(now)" }
            }
            return line
        }
        try? updated.joined(separator: "\n").appending("\n").write(toFile: taskFile, atomically: true, encoding: .utf8)
        log(type: "Task", minutes: 10, cards: 0, note: "Completed task")
        refresh()
    }
}

// MARK: Pages

struct DashboardPage: View {
    let stats: Stats
    let logs: [StudyLog]
    let runHub: () -> Void
    let sort: () -> Void
    let review: () -> Void
    let openInbox: () -> Void
    let openAnkiMedia: () -> Void
    let logLecture: () -> Void
    let logAnki50: () -> Void
    let logAnki100: () -> Void
    let logStudy60: () -> Void

    @Binding var standupToday: String
    @Binding var standupTomorrow: String
    @Binding var standupBlockers: String
    @Binding var standupEnergy: String
    @Binding var standupRating: String
    let saveStandup: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            DashboardCards(stats: stats)

            HStack(alignment: .top, spacing: 20) {
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        PanelHeader("Command Deck", "Fast actions that actually matter")
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
                            ActionTile("Run Hub", "Full sequence", "command", runHub)
                            ActionTile("Auto Sort", "Downloads only", "tray.and.arrow.down", sort)
                            ActionTile("Review", "Weekly stats", "chart.bar.doc.horizontal", review)
                            ActionTile("Inbox", "Open queue", "tray.full", openInbox)
                            ActionTile("Anki Media", "collection.media", "photo.stack", openAnkiMedia)
                        }
                    }.padding(18)
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        PanelHeader("Quick Log", "Lecture and Anki increments")
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), spacing: 10)], spacing: 10) {
                            MiniLog("Lecture", "+50m", logLecture)
                            MiniLog("+50 🃜", "+15m", logAnki50)
                            MiniLog("+100 🃚", "+30m", logAnki100)
                            MiniLog("Study", "+60m", logStudy60)
                        }
                    }.padding(18)
                }
                .frame(width: 390)
            }

            HStack(alignment: .top, spacing: 20) {
                StandupCard(
                    today: $standupToday,
                    tomorrow: $standupTomorrow,
                    blockers: $standupBlockers,
                    energy: $standupEnergy,
                    rating: $standupRating,
                    save: saveStandup
                )

                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        PanelHeader("Today’s Vital Signs", "Time, cards, and usefulness signal")
                        RingScore(minutes: stats.todayMinutes + stats.manualMinutesToday, cards: stats.todayCards)
                        Heatmap(logs: logs)
                    }.padding(18)
                }
                .frame(width: 440)
            }
        }
    }
}

struct CoursesPage: View {
    let stats: Stats
    let open: (String) -> Void
    @State private var expanded: String? = "01 BPM 500"

    var base: String { FileManager.default.homeDirectoryForCurrentUser.path + "/Medical School" }

    var body: some View {
        VStack(spacing: 20) {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 220), spacing: 16)], spacing: 16) {
                CourseCard("01 BPM 500", term: "Term 1", files: stats.bpm500, action: { open("\(base)/10 Courses/Term 1/01 BPM 500") })
                CourseCard("01 BPM 501", term: "Term 1", files: stats.bpm501, action: { open("\(base)/10 Courses/Term 1/01 BPM 501") })
                CourseCard("02 PPM 500", term: "Term 2", files: stats.ppm500, action: { open("\(base)/10 Courses/Term 2/02 PPM 500") })
                CourseCard("02 PPM 501", term: "Term 2", files: stats.ppm501, action: { open("\(base)/10 Courses/Term 2/02 PPM 501") })
                CourseCard("02 PPM 502", term: "Term 2", files: stats.ppm502, action: { open("\(base)/10 Courses/Term 2/02 PPM 502") })
            }

            CourseModules(
                expanded: $expanded,
                open: open,
                base: base
            )
        }
    }
}

struct CourseModules: View {
    @Binding var expanded: String?
    let open: (String) -> Void
    let base: String

    let groups: [(String, String, [String])] = [
        ("01 BPM 500", "10 Courses/Term 1/01 BPM 500", ["FTM 1", "FTM 2", "MSK", "CPR 1", "CPR 2"]),
        ("01 BPM 501", "10 Courses/Term 1/01 BPM 501", ["ER", "DM", "NB 1", "NB 2", "NB 3"]),
        ("02 PPM 500", "10 Courses/Term 2/02 PPM 500", ["Lectures", "Slides", "Notes", "Study Guides", "Weak Areas"]),
        ("02 PPM 501", "10 Courses/Term 2/02 PPM 501", ["Lectures", "Slides", "Notes", "Study Guides", "Weak Areas"]),
        ("02 PPM 502", "10 Courses/Term 2/02 PPM 502", ["Lectures", "Slides", "Notes", "Study Guides", "Weak Areas"])
    ]

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 14) {
                PanelHeader("Course Modules", "Dropdown-style module access")

                ForEach(groups, id: \.0) { group in
                    VStack(spacing: 8) {
                        Button {
                            expanded = expanded == group.0 ? nil : group.0
                        } label: {
                            HStack {
                                Text(group.0)
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                                Spacer()
                                Image(systemName: expanded == group.0 ? "chevron.down" : "chevron.right")
                            }
                            .foregroundColor(.white)
                            .padding(12)
                            .glassButton()
                        }
                        .buttonStyle(.plain)

                        if expanded == group.0 {
                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 135), spacing: 10)], spacing: 10) {
                                ForEach(group.2, id: \.self) { module in
                                    MiniButton(module) {
                                        open("\(base)/\(group.1)/\(module)")
                                    }
                                }
                            }
                            .padding(.horizontal, 4)
                            .padding(.bottom, 6)
                        }
                    }
                }
            }
            .padding(18)
        }
    }
}






struct CourseTrackerPage: View {
    let items: [CourseTrackerItem]
    let bsceItems: [CourseTrackerItem]
    let base: String
    let open: (String) -> Void
    let updateItem: (CourseTrackerItem, String) -> Void
    let updateBSCEItem: (CourseTrackerItem, String) -> Void
    let addPractice: (String, String, String, String) -> Void

    @State private var selectedTerm = "T2"
    @State private var selectedModule = "NB3"
    @State private var newPracticeTitle = ""
    @State private var newPracticeCount = ""
    @State private var newPracticeScore = "A"
    @State private var newPracticeType = "PLG"

    let terms = ["T1", "T2", "T3", "T4", "T5"]

    let modulesByTerm: [String: [String]] = [
        "T1": ["FTM 1", "FTM 2", "MSK", "CPR 1", "CPR 2"],
        "T2": ["ER", "DM", "NB1", "NB2", "NB3", "BSCE"],
        "T3": ["Term 3"],
        "T4": ["Term 4"],
        "T5": ["Term 5"]
    ]

    var visibleItems: [CourseTrackerItem] {
        if selectedTerm == "T2" && selectedModule == "NB3" {
            return items
        }
        if selectedTerm == "T2" && selectedModule == "BSCE" {
            return bsceItems
        }
        return []
    }

    var activeUpdate: (CourseTrackerItem, String) -> Void {
        selectedModule == "BSCE" ? updateBSCEItem : updateItem
    }

    var lectures: [CourseTrackerItem] {
        visibleItems.filter { $0.type.lowercased() == "lecture" }
    }

    var dlas: [CourseTrackerItem] {
        visibleItems.filter { $0.type.lowercased() == "dla" }
    }

    var pqs: [CourseTrackerItem] {
        visibleItems.filter { $0.type.lowercased() == "pq" }
    }

    var practice: [CourseTrackerItem] {
        visibleItems.filter {
            ["pq", "plg", "esoft", "imcq", "small group", "other event"].contains($0.type.lowercased())
        }
    }

    var lectureScore: Double {
        guard !lectures.isEmpty else { return 0 }
        return lectures.map { min(Double($0.quality), 3.0) / 3.0 }.reduce(0,+) / Double(lectures.count)
    }

    var dlaScore: Double {
        guard !dlas.isEmpty else { return 0 }
        return dlas.map { min(Double($0.quality), 3.0) / 3.0 }.reduce(0,+) / Double(dlas.count)
    }

    var pqScore: Double {
        guard !practice.isEmpty else { return 0 }
        let scored = practice.map { item -> Double in
            switch item.color.lowercased() {
            case "darkgreen": return 1.0
            case "lightgreen": return 0.82
            case "orange": return 0.62
            case "red": return 0.35
            default: return min(Double(item.quality), 3.0) / 3.0
            }
        }
        return scored.reduce(0,+) / Double(scored.count)
    }

    var masteryScore: Int {
        let raw = (lectureScore * 0.46) + (dlaScore * 0.34) + (pqScore * 0.20)
        return Int((raw * 100).rounded())
    }

    var nextMove: String {
        let weakLectures = lectures.filter { $0.quality < 2 }
        let weakDLAs = dlas.filter { $0.quality < 2 }
        let weakPractice = practice.filter { $0.color.lowercased() == "red" || $0.quality < 1 }

        if !weakLectures.isEmpty {
            return "Highest yield: push lectures to 2 passes first. Start with \(weakLectures.first?.label ?? "the next weak lecture")."
        }

        if !weakDLAs.isEmpty {
            return "Next best move: DLAs. They consolidate lecture understanding and protect exam performance."
        }

        if masteryScore < 85 && !weakPractice.isEmpty {
            return "Now convert questions into points: do PQ / PLG / IMCQ and score the result."
        }

        if masteryScore >= 90 {
            return "Maintenance mode: mixed review + missed questions. Do not over-polish. The trap has teeth."
        }

        return "Balanced review: one mature lecture pass, one DLA pass, then one question block."
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            GlassCard {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Course Tracker")
                                .font(.system(size: 30, weight: .black, design: .rounded))
                                .foregroundColor(.white)

                            Text("Term → module → lectures, DLAs, practice, passes, mastery.")
                                .font(.system(size: 12.5, weight: .medium, design: .rounded))
                                .foregroundColor(.white.opacity(0.58))
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 4) {
                            Text("\(masteryScore)%")
                                .font(.system(size: 34, weight: .black, design: .rounded))
                                .foregroundColor(masteryColor)

                            Text("module mastery")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundColor(.white.opacity(0.45))
                        }
                    }

                    HStack(spacing: 8) {
                        ForEach(terms, id: \.self) { term in
                            TrackerSelectButton(title: term, selected: selectedTerm == term) {
                                selectedTerm = term
                                selectedModule = modulesByTerm[term]?.first ?? ""
                            }
                        }
                    }

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), spacing: 8)], spacing: 8) {
                        ForEach(modulesByTerm[selectedTerm] ?? [], id: \.self) { module in
                            TrackerSelectButton(title: module, selected: selectedModule == module) {
                                selectedModule = module
                            }
                        }
                    }

                    HStack(spacing: 10) {
                        TrackerMetric(title: "Lectures", value: "\(matureCount(lectures))/\(lectures.count)", color: .green)
                        TrackerMetric(title: "DLAs", value: "\(matureCount(dlas))/\(dlas.count)", color: .cyan)
                        TrackerMetric(title: "Practice", value: "\(practice.count)", color: .orange)
                        TrackerMetric(title: "Young", value: "\(youngCount)", color: .mint)
                        TrackerMetric(title: "Needs", value: "\(needsCount)", color: .red)
                    }

                    GlassCard {
                        HStack(alignment: .top, spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(Color.cyan.opacity(0.16))
                                    .frame(width: 38, height: 38)
                                Image(systemName: "sparkles")
                                    .font(.system(size: 15, weight: .black))
                                    .foregroundColor(.cyan)
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Next Smart Move")
                                    .font(.system(size: 15, weight: .black, design: .rounded))
                                    .foregroundColor(.white)

                                Text(nextMove)
                                    .font(.system(size: 12.5, weight: .medium, design: .rounded))
                                    .foregroundColor(.white.opacity(0.70))
                                    .fixedSize(horizontal: false, vertical: true)
                                    .lineSpacing(2)
                            }

                            Spacer(minLength: 16)

                            Text("Priority")
                                .font(.system(size: 11, weight: .black, design: .rounded))
                                .foregroundColor(.white.opacity(0.86))
                                .padding(.horizontal, 12)
                                .frame(height: 32)
                                .background(
                                    Capsule()
                                        .fill(Color.cyan.opacity(0.14))
                                        .overlay(Capsule().stroke(Color.cyan.opacity(0.24), lineWidth: 1))
                                )
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            if visibleItems.isEmpty {
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("\(selectedTerm) / \(selectedModule)")
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundColor(.white)

                        Text("Framework staged. NB3 is active now. Next build can generate full trackers for ER, DM, NB1, NB2, and BSCE.")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.62))

                        if selectedTerm == "T2" && selectedModule == "BSCE" {
                            Text("BSCE should review 10 modules: FTM 1, FTM 2, MSK, CPR 1, CPR 2, ER, DM, NB1, NB2, NB3.")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundColor(.cyan.opacity(0.9))
                        }
                    }
                }
            } else {
                TrackerListSection(
                    title: "Lectures",
                    subtitle: "0 blue • 1 red needs mastery • 2 light green young • 3+ dark green mature",
                    items: lectures,
                    updateItem: updateItem
                )

                TrackerListSection(
                    title: "DLAs",
                    subtitle: "Second-highest weight after lectures. Treat these as consolidation passes.",
                    items: dlas,
                    updateItem: updateItem
                )

                TrackerListSection(
                    title: "Practice Questions / Reviews",
                    subtitle: "PQ, PLG, eSoft, IMCQ, small group framework.",
                    items: practice,
                    updateItem: updateItem
                )

                PracticeInputCard(
                    title: $newPracticeTitle,
                    count: $newPracticeCount,
                    score: $newPracticeScore,
                    type: $newPracticeType,
                    add: {
                        addPractice(newPracticeType, newPracticeTitle, newPracticeCount, newPracticeScore)
                        newPracticeTitle = ""
                        newPracticeCount = ""
                        newPracticeScore = "A"
                    }
                )
            }
        }
    }

    var masteryColor: Color {
        if masteryScore >= 90 { return .blue }
        if masteryScore >= 80 { return .green }
        if masteryScore >= 65 { return .orange }
        return .red
    }

    var youngCount: Int {
        visibleItems.filter { $0.status.lowercased() == "young" || $0.color.lowercased() == "lightgreen" }.count
    }

    var needsCount: Int {
        visibleItems.filter { $0.status.lowercased().contains("needs") || $0.color.lowercased() == "red" }.count
    }

    func matureCount(_ group: [CourseTrackerItem]) -> Int {
        group.filter { $0.quality >= 3 || $0.status.lowercased() == "mature" || $0.color.lowercased() == "darkgreen" }.count
    }
}

struct TrackerListSection: View {
    let title: String
    let subtitle: String
    let items: [CourseTrackerItem]
    let updateItem: (CourseTrackerItem, String) -> Void

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(title)
                            .font(.system(size: 20, weight: .black, design: .rounded))
                            .foregroundColor(.white)

                        Text(subtitle)
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.52))
                    }

                    Spacer()

                    Text("\(items.count)")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .foregroundColor(.white.opacity(0.72))
                        .padding(.horizontal, 10)
                        .frame(height: 28)
                        .background(Capsule().fill(Color.white.opacity(0.08)))
                }

                VStack(spacing: 6) {
                    ForEach(items) { item in
                        TrackerRow(item: item, updateItem: updateItem)
                    }
                }
            }
        }
    }
}


struct TrackerRow: View {
    let item: CourseTrackerItem
    let updateItem: (CourseTrackerItem, String) -> Void

    var ankiPasses: Int {
        extractAnkiPasses(item.notes)
    }

    var body: some View {
        HStack(spacing: 10) {
            Rectangle()
                .fill(statusColor)
                .frame(width: 5)
                .clipShape(RoundedRectangle(cornerRadius: 3))
                .shadow(color: statusColor.opacity(0.55), radius: 8)

            VStack(alignment: .leading, spacing: 3) {
                Text(item.label)
                    .font(.system(size: 11.2, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.94))
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(item.week)
                    Text(item.type)
                    Text(statusLabel)
                    Text("\(item.quality) pass\(item.quality == 1 ? "" : "es")")
                    if ankiPasses > 0 {
                        Text("Anki \(ankiPasses)")
                            .foregroundColor(ankiColor.opacity(0.95))
                    }
                }
                .font(.system(size: 9.2, weight: .bold, design: .rounded))
                .foregroundColor(.white.opacity(0.44))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            PassTicks(count: item.quality)
                .frame(width: 82, alignment: .leading)

            AnkiTicks(count: ankiPasses)
                .frame(width: 70, alignment: .leading)

            HStack(spacing: 5) {
                SmallTrackerButton("-") { updateItem(item, "removePass") }
                SmallTrackerButton("+") { updateItem(item, "addPass") }
                SmallTrackerButton("Anki") { updateItem(item, "ankiPass") }
                SmallTrackerButton("Need") { updateItem(item, "needsWork") }
                SmallTrackerButton("Mature") { updateItem(item, "mastered") }
            }
            .frame(width: 258, alignment: .trailing)
        }
        .padding(.vertical, 7)
        .padding(.horizontal, 9)
        .background(
            ZStack(alignment: .trailing) {
                RoundedRectangle(cornerRadius: 14)
                    .fill(statusColor.opacity(0.085))

                AnkiObliqueFill(color: ankiColor, active: ankiPasses > 0)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.white.opacity(0.075), lineWidth: 1)
            }
        )
    }

    var statusLabel: String {
        if item.quality <= 0 { return "Not started" }
        if item.quality == 1 { return "Needs mastery" }
        if item.quality == 2 { return "Young" }
        return "Mature"
    }

    var statusColor: Color {
        if item.quality <= 0 { return .blue }
        if item.quality == 1 { return .red }
        if item.quality == 2 { return .mint }
        return .green
    }

    var ankiColor: Color {
        if ankiPasses <= 0 { return .clear }
        if ankiPasses == 1 { return .purple }
        if ankiPasses == 2 { return .orange }
        if ankiPasses == 3 { return .cyan }
        return .blue
    }
}

struct PassTicks: View {
    let count: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { index in
                Image(systemName: index < min(count, 3) ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(index < min(count, 3) ? tickColor : .white.opacity(0.22))
            }

            if count > 3 {
                Text("+\(count - 3)")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundColor(.green.opacity(0.95))
            }
        }
    }

    var tickColor: Color {
        if count <= 1 { return .red }
        if count == 2 { return .mint }
        return .green
    }
}

struct AnkiTicks: View {
    let count: Int

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: "rectangle.stack")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(count > 0 ? ankiColor : .white.opacity(0.24))

            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(index < min(count, 3) ? ankiColor : Color.white.opacity(0.18))
                    .frame(width: 6, height: 6)
            }

            if count > 3 {
                Text("+\(count - 3)")
                    .font(.system(size: 8.5, weight: .black, design: .rounded))
                    .foregroundColor(ankiColor)
            }
        }
    }

    var ankiColor: Color {
        if count <= 0 { return .white.opacity(0.18) }
        if count == 1 { return .purple }
        if count == 2 { return .orange }
        if count == 3 { return .cyan }
        return .blue
    }
}

struct AnkiObliqueFill: View {
    let color: Color
    let active: Bool

    var body: some View {
        GeometryReader { geo in
            if active {
                Path { path in
                    let w = geo.size.width
                    let h = geo.size.height
                    path.move(to: CGPoint(x: w * 0.74, y: 0))
                    path.addLine(to: CGPoint(x: w, y: 0))
                    path.addLine(to: CGPoint(x: w, y: h))
                    path.addLine(to: CGPoint(x: w * 0.66, y: h))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [color.opacity(0.05), color.opacity(0.28)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            }
        }
    }
}

struct PracticeInputCard: View {
    @Binding var title: String
    @Binding var count: String
    @Binding var score: String
    @Binding var type: String
    let add: () -> Void

    let types = ["PLG", "PQ", "eSoft", "IMCQ", "Small Group"]
    let scores = ["A", "B", "C", "D", "F"]

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("Add Practice / Review")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundColor(.white)

                HStack(spacing: 8) {
                    Picker("Type", selection: $type) {
                        ForEach(types, id: \.self) { Text($0) }
                    }
                    .frame(width: 120)

                    TextField("One-line title", text: $title)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .padding(.horizontal, 10)
                        .frame(height: 34)
                        .background(RoundedRectangle(cornerRadius: 11).fill(Color.white.opacity(0.08)))

                    TextField("#", text: $count)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .padding(.horizontal, 10)
                        .frame(width: 58, height: 34)
                        .background(RoundedRectangle(cornerRadius: 11).fill(Color.white.opacity(0.08)))

                    Picker("Score", selection: $score) {
                        ForEach(scores, id: \.self) { Text($0) }
                    }
                    .frame(width: 80)

                    Button("Add", action: add)
                        .buttonStyle(.plain)
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .frame(height: 34)
                        .glassButton()
                }
            }
        }
    }
}

struct TrackerSelectButton: View {
    let title: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundColor(.white)
                .frame(minWidth: 56)
                .frame(height: 34)
                .padding(.horizontal, 8)
                .background(
                    RoundedRectangle(cornerRadius: 13)
                        .fill(selected ? Color.cyan.opacity(0.26) : Color.white.opacity(0.07))
                        .overlay(
                            RoundedRectangle(cornerRadius: 13)
                                .stroke(selected ? Color.cyan.opacity(0.42) : Color.white.opacity(0.09), lineWidth: 1)
                        )
                )
        }
        .buttonStyle(.plain)
    }
}

struct TrackerMetric: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(color)

            Text(title)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundColor(.white.opacity(0.45))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(color.opacity(0.10))
                .overlay(RoundedRectangle(cornerRadius: 15).stroke(Color.white.opacity(0.07)))
        )
    }
}

struct SmallTrackerButton: View {
    let title: String
    let action: () -> Void

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(title, action: action)
            .buttonStyle(.plain)
            .font(.system(size: 9.5, weight: .black, design: .rounded))
            .foregroundColor(.white.opacity(0.9))
            .frame(width: title == "Mature" ? 54 : title == "Anki" ? 44 : title == "Need" ? 42 : 32, height: 25)
            .background(
                RoundedRectangle(cornerRadius: 9)
                    .fill(Color.white.opacity(0.075))
                    .overlay(RoundedRectangle(cornerRadius: 9).stroke(Color.white.opacity(0.09)))
            )
    }
}


struct StepPage: View {
    let stats: Stats
    let open: (String) -> Void
    let ankiMedia: String
    var base: String { FileManager.default.homeDirectoryForCurrentUser.path + "/Medical School" }

    var body: some View {
        VStack(spacing: 20) {
            DashboardCards(stats: stats)

            GlassCard {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHeader("STEP 1 Control", "Boards assets, weak areas, missed questions")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
                        ActionTile("STEP 1", "Main folder", "brain.head.profile") { open("\(base)/03 🧠 STEP 1") }
                        ActionTile("Weak Topics", "Attack list", "target") { open("\(base)/03 🧠 STEP 1/Weak Topics") }
                        ActionTile("Missed Qs", "Error log", "xmark.circle") { open("\(base)/03 🧠 STEP 1/Missed Questions") }
                        ActionTile("Practice", "NBME/UWorld", "doc.text.magnifyingglass") { open("\(base)/03 🧠 STEP 1/Practice Exams") }
                        ActionTile("Anki Media", "collection.media", "photo.stack") { open(ankiMedia) }
                    }
                }.padding(18)
            }
        }
    }
}

struct ReportsPage: View {
    let stats: Stats
    let logs: [StudyLog]
    let status: String
    let open: (String) -> Void
    let base: String

    var body: some View {
        VStack(spacing: 20) {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 16)], spacing: 16) {
                ReportHero(title: "Inbox Pressure", value: "\(stats.inbox)", caption: "files waiting")
                ReportHero(title: "Needs Review", value: "\(stats.needsReview)", caption: "tagged items")
                ReportHero(title: "Today Output", value: "\(stats.todayMinutes)m", caption: "\(stats.todayCards) cards")
                ReportHero(title: "Journal Entries", value: "\(stats.journalEntries)", caption: "standups saved")
            }

            GlassCard {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHeader("Live System Report", "Raw backend status")
                    Text(status)
                        .font(.system(size: 12, weight: .regular, design: .monospaced))
                        .foregroundColor(.white.opacity(0.72))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .textSelection(.enabled)

                    MiniButton("Open Reports Folder") {
                        open("\(base)/09 Admin/Reports")
                    }
                }.padding(18)
            }
        }
    }
}

struct ProductivityPage: View {
    let stats: Stats
    let logs: [StudyLog]
    let logLecture: () -> Void
    let logAnki50: () -> Void
    let logAnki100: () -> Void
    let logAnki150: () -> Void
    let logAnki200: () -> Void
    let logStudy180: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            GlassCard {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHeader("Productivity Console", "Manual entries now. API integrations later.")
                    RingScore(minutes: stats.todayMinutes + stats.manualMinutesToday, cards: stats.todayCards)

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), spacing: 10)], spacing: 10) {
                        MiniLog("Lecture", "+50m", logLecture)
                        MiniLog("+50 🃜", "+15m", logAnki50)
                        MiniLog("+100 🃚", "+30m", logAnki100)
                        MiniLog("+150 🃖", "+45m", logAnki150)
                        MiniLog("+200 🃁", "+60m", logAnki200)
                        MiniLog("Deep Study", "+180m", logStudy180)
                    }
                }.padding(18)
            }

            GlassCard {
                VStack(alignment: .leading, spacing: 16) {
                    PanelHeader("Calendar Heatmap", "Red <3h or <100 cards • Orange <5h or 150-200 • Green >6h or 250-300 • Blue 👑 >8h or 350-400")
                    Heatmap(logs: logs)
                }.padding(18)
            }

            GlassCard {
                VStack(alignment: .leading, spacing: 12) {
                    PanelHeader("Future Integration Slots", "Framework only for now")
                    Text("Anki API / local collection parsing, ScreenTime export parsing, iCal calendar import, manual correction reports, and day usefulness scoring will plug into this page.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.62))
                }.padding(18)
            }
        }
    }
}

struct TasksPage: View {
    let tasks: [TaskItem]
    @Binding var newTask: String
    let addTask: () -> Void
    let completeTask: (TaskItem) -> Void

    var openTasks: [TaskItem] { tasks.filter { $0.status != "done" } }

    var body: some View {
        VStack(spacing: 20) {
            GlassCard {
                VStack(alignment: .leading, spacing: 14) {
                    PanelHeader("Task Capture", "Tasks become productivity events when completed")
                    HStack {
                        TextField("Add task", text: $newTask)
                            .textFieldStyle(.plain)
                            .foregroundColor(.white)
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.06)))

                        Button("Add", action: addTask)
                            .buttonStyle(.plain)
                            .padding(.horizontal, 16)
                            .frame(height: 40)
                            .glassButton()
                    }
                }.padding(18)
            }

            GlassCard {
                VStack(alignment: .leading, spacing: 10) {
                    PanelHeader("Open Tasks", "\(openTasks.count) active")
                    ForEach(openTasks) { task in
                        HStack {
                            Button(action: { completeTask(task) }) {
                                Image(systemName: "circle")
                            }
                            .buttonStyle(.plain)
                            .foregroundColor(.cyan)

                            Text(task.title)
                                .foregroundColor(.white)
                                .font(.system(size: 13, weight: .semibold, design: .rounded))

                            Spacer()
                        }
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.04)))
                    }
                }.padding(18)
            }
        }
    }
}

struct JournalPage: View {
    let entries: [JournalEntry]
    let openJournalFolder: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            GlassCard {
                VStack(alignment: .leading, spacing: 12) {
                    PanelHeader("Journal Archive", "Previous standups")
                    MiniButton("Open Journal Folder", openJournalFolder)
                }.padding(18)
            }

            ForEach(entries.reversed()) { entry in
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(entry.date)
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundColor(.cyan)

                        Text("Today: \(entry.today)")
                            .foregroundColor(.white.opacity(0.82))

                        Text("Tomorrow: \(entry.tomorrow)")
                            .foregroundColor(.white.opacity(0.72))

                        Text("Blockers: \(entry.blockers)")
                            .foregroundColor(.white.opacity(0.58))

                        HStack {
                            Text("Energy: \(entry.energy)")
                            Text("Rating: \(entry.rating)")
                        }
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.white.opacity(0.50))
                    }
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                }
            }
        }
    }
}

struct IntegrationsPage: View {
    let base: String
    let open: (String) -> Void

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 16)], spacing: 16) {
            ActionTile("Anki Integration", "future API/parser", "rectangle.stack") { open("\(base)/09 Admin/Integrations/Anki") }
            ActionTile("ScreenTime", "future report import", "desktopcomputer") { open("\(base)/09 Admin/Integrations/ScreenTime") }
            ActionTile("Calendar", "future iCal hooks", "calendar") { open("\(base)/09 Admin/Integrations/Calendar") }
            ActionTile("Manual Time", "correct inaccuracies", "slider.horizontal.3") { open("\(base)/09 Admin/Integrations/Manual Time Entries") }
        }
    }
}


struct PromptPage: View {
    let base: String
    let open: (String) -> Void

    @State private var prompts: [PromptItem] = []
    @State private var search = ""
    @State private var selectedCategory = "All"
    @State private var newTitle = ""
    @State private var newCategory = "Prompts"
    @State private var newTags = ""
    @State private var newBody = ""
    @State private var status = "Prompt library ready."

    let categories = [
        "All",
        "Prompts",
        "Code",
        "Anki Formatting",
        "Question Prompts",
        "File Upload Workflows",
        "Templates"
    ]

    var filtered: [PromptItem] {
        prompts.filter { p in
            let categoryMatch = selectedCategory == "All" || p.category == selectedCategory
            let query = search.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let searchMatch = query.isEmpty ||
                p.title.lowercased().contains(query) ||
                p.category.lowercased().contains(query) ||
                p.tags.lowercased().contains(query) ||
                p.preview.lowercased().contains(query)
            return categoryMatch && searchMatch
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                GlassCard {
                    VStack(alignment: .leading, spacing: 14) {
                        PanelHeader("Prompt Library", "Craft-style prompt cards for Anki, code, uploads, and medical workflows")

                        HStack(spacing: 10) {
                            TextField("Search prompts, code, tags, Anki templates…", text: $search)
                                .textFieldStyle(.plain)
                                .padding(12)
                                .background(.white.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 16))

                            MiniButton("Refresh") {
                                prompts = loadPrompts(base: base)
                                status = "Reloaded \(prompts.count) prompts."
                            }

                            MiniButton("Open Folder") {
                                open("\(base)/09 Admin/App Data/Prompt Library")
                            }
                        }

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(categories, id: \.self) { cat in
                                    Button {
                                        selectedCategory = cat
                                    } label: {
                                        Text(cat)
                                            .font(.system(size: 12, weight: .semibold))
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 8)
                                            .background(selectedCategory == cat ? .white.opacity(0.18) : .white.opacity(0.07))
                                            .clipShape(Capsule())
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }

                        Text(status)
                            .foregroundStyle(.secondary)
                            .font(.caption)
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        PanelHeader("Add Prompt", "Save long prompts, CSS, HTML, card workflows, or question templates")

                        TextField("Title", text: $newTitle)
                            .textFieldStyle(.plain)
                            .padding(10)
                            .background(.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 14))

                        HStack {
                            Picker("Category", selection: $newCategory) {
                                ForEach(categories.filter { $0 != "All" }, id: \.self) { cat in
                                    Text(cat).tag(cat)
                                }
                            }
                            .pickerStyle(.menu)

                            TextField("Tags: anki, css, nbme, prompt", text: $newTags)
                                .textFieldStyle(.plain)
                                .padding(10)
                                .background(.white.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }

                        TextEditor(text: $newBody)
                            .font(.system(.body, design: .monospaced))
                            .frame(minHeight: 130)
                            .scrollContentBackground(.hidden)
                            .padding(8)
                            .background(.white.opacity(0.055))
                            .clipShape(RoundedRectangle(cornerRadius: 16))

                        HStack {
                            MiniButton("Save Prompt") {
                                savePrompt()
                            }

                            MiniButton("Clear") {
                                newTitle = ""
                                newTags = ""
                                newBody = ""
                                status = "Draft cleared."
                            }
                        }
                    }
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 310), spacing: 14)], spacing: 14) {
                    ForEach(filtered) { prompt in
                        PromptCard(prompt: prompt, open: open) {
                            let pasteboard = NSPasteboard.general
                            pasteboard.clearContents()
                            pasteboard.setString(prompt.bodyText, forType: .string)
                            status = "Copied: \(prompt.title)"
                        }
                    }
                }
            }
            .padding(24)
        }
        .onAppear {
            prompts = loadPrompts(base: base)
            status = "Loaded \(prompts.count) prompts."
        }
    }

    func savePrompt() {
        let title = newTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        let body = newBody.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty, !body.isEmpty else {
            status = "Add a title and body first."
            return
        }

        let safeTitle = title
            .replacingOccurrences(of: "/", with: "-")
            .replacingOccurrences(of: ":", with: "-")
            .replacingOccurrences(of: "\n", with: " ")

        let folder = "\(base)/09 Admin/App Data/Prompt Library/\(newCategory)"
        try? FileManager.default.createDirectory(atPath: folder, withIntermediateDirectories: true)

        let filePath = "\(folder)/\(safeTitle).md"
        try? body.write(toFile: filePath, atomically: true, encoding: .utf8)

        let id = UUID().uuidString.prefix(8)
        let day = DateFormatter.shortDate.string(from: Date())
        let relativePath = "09 Admin/App Data/Prompt Library/\(newCategory)/\(safeTitle).md"
        let csv = "\(id),\(title),\(newCategory),\"\(newTags)\",\(day),\(day),\(relativePath)\n"
        append(csv.trimmingCharacters(in: CharacterSet.newlines), to: "\(base)/09 Admin/App Data/prompt_library.csv")

        prompts = loadPrompts(base: base)
        status = "Saved prompt: \(title)"
        newTitle = ""
        newTags = ""
        newBody = ""
    }
}

struct PromptCard: View {
    let prompt: PromptItem
    let open: (String) -> Void
    let copy: () -> Void

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(prompt.title)
                            .font(.headline)

                        Text(prompt.category)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Text("⌘")
                        .font(.title3)
                        .opacity(0.55)
                }

                Text(prompt.preview)
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
                    .lineLimit(5)

                if !prompt.tags.isEmpty {
                    Text(prompt.tags)
                        .font(.caption2)
                        .foregroundStyle(.cyan.opacity(0.85))
                        .lineLimit(1)
                }

                HStack {
                    MiniButton("Copy All", copy)

                    MiniButton("Open") {
                        shell("open \"\(prompt.fullPath)\"")
                    }

                    MiniButton("Reveal") {
                        shell("open -R \"\(prompt.fullPath)\"")
                    }
                }
            }
        }
    }
}


struct HubFoldersPage: View {
    let base: String
    let open: (String) -> Void

    var folders: [(String, String, String)] {
        [
            ("Inbox", "00 📥 Inbox - Need Work Look Over", "tray.full"),
            ("01 BPM 500", "10 Courses/Term 1/01 BPM 500", "book"),
            ("01 BPM 501", "10 Courses/Term 1/01 BPM 501", "book.closed"),
            ("02 PPM 500", "10 Courses/Term 2/02 PPM 500", "cross.case"),
            ("02 PPM 501", "10 Courses/Term 2/02 PPM 501", "cross.case.fill"),
            ("02 PPM 502", "10 Courses/Term 2/02 PPM 502", "stethoscope"),
            ("STEP 1", "03 🧠 STEP 1", "brain.head.profile"),
            ("Anki", "04 🃏 Anki Decks", "rectangle.stack"),
            ("Research", "05 🔬 Research", "doc.text.magnifyingglass"),
            ("Summaries", "06 📊 Summaries and Sheets", "doc.text"),
            ("Admin", "09 Admin", "gearshape"),
            ("Archives", "99 🗄️ Archives", "archivebox")
        ]
    }

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 210), spacing: 16)], spacing: 16) {
            ForEach(folders, id: \.0) { item in
                ActionTile(item.0, item.1, item.2) {
                    open("\(base)/\(item.1)")
                }
            }
        }
    }
}

// MARK: Components

struct StandupCard: View {
    @Binding var today: String
    @Binding var tomorrow: String
    @Binding var blockers: String
    @Binding var energy: String
    @Binding var rating: String
    let save: () -> Void

    let energies = ["Low", "Medium", "High"]
    let ratings = ["Wasted", "Useful", "Strong", "Elite"]

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 14) {
                PanelHeader("Daily Standup", "What did you do today, and what is tomorrow’s attack?")

                TextField("What did you do today?", text: $today)
                    .standupField()

                TextField("What will you do tomorrow?", text: $tomorrow)
                    .standupField()

                TextField("Blockers / friction", text: $blockers)
                    .standupField()

                HStack {
                    Picker("Energy", selection: $energy) {
                        ForEach(energies, id: \.self) { Text($0) }
                    }
                    .pickerStyle(.segmented)

                    Picker("Rating", selection: $rating) {
                        ForEach(ratings, id: \.self) { Text($0) }
                    }
                    .pickerStyle(.segmented)
                }

                Button("Save Standup", action: save)
                    .buttonStyle(.plain)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .frame(height: 42)
                    .glassButton()
            }
            .padding(18)
        }
    }
}

struct Sidebar: View {
    @Binding var selected: String

    let items = [
        ("Dashboard", "square.grid.2x2"),
        ("Courses", "books.vertical"),
        ("Course Tracker", "checkmark.seal"),
        ("STEP 1", "brain.head.profile"),
        ("Reports", "chart.xyaxis.line"),
        ("Productivity", "calendar"),
        ("Tasks", "checklist"),
        ("Journal", "book.pages"),
        ("Integrations", "point.3.connected.trianglepath.dotted"),
        ("Prompt Library", "text.book.closed"),
        ("Hub Folders", "folder")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 10) {
                Text("JD")
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color.cyan.opacity(0.75)))

                VStack(alignment: .leading, spacing: 0) {
                    Text("MedOS")
                        .font(.system(size: 19, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Text("v0.01.01")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.42))
                }
            }
            .padding(.top, 22)
            .padding(.horizontal, 18)

            Text("CONTROL SURFACE")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundColor(.white.opacity(0.36))
                .padding(.horizontal, 18)

            VStack(spacing: 7) {
                ForEach(items, id: \.0) { item in
                    SideButton(item.0, item.1, selected == item.0) {
                        selected = item.0
                    }
                }
            }
            .padding(.horizontal, 12)

            Spacer()

            Text("Designed for execution, not decoration.")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundColor(.white.opacity(0.42))
                .padding(.horizontal, 18)
                .padding(.bottom, 22)
        }
        .frame(width: 245)
        .background(Color.black.opacity(0.10))
    }
}

struct TopBar: View {
    let title: String
    let subtitle: String
    let refreshing: Bool
    let refreshAction: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.52))
            }

            Spacer()

            Button(action: refreshAction) {
                HStack(spacing: 8) {
                    Image(systemName: refreshing ? "hourglass" : "arrow.clockwise")
                    Text(refreshing ? "Refreshing" : "Refresh")
                }
                .font(.system(size: 12.5, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .padding(.horizontal, 14)
                .frame(height: 38)
                .glassButton()
            }
            .buttonStyle(.plain)
        }
    }
}

struct DashboardCards: View {
    let stats: Stats

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 205), spacing: 16)], spacing: 16) {
            StatCard("Inbox", "\(stats.inbox)", "files waiting", "tray.full", trend: stats.inbox > 30 ? "Heavy" : "Clean")
            StatCard("Downloads", "\(stats.downloads)", "loose files", "arrow.down.doc", trend: stats.downloads > 0 ? "Sort" : "Clear")
            StatCard("Anki", "\(stats.todayCards)", "cards today", "rectangle.stack", trend: "🃜🃚🃖")
            StatCard("Study", "\(stats.todayMinutes + stats.manualMinutesToday)m", "logged today", "clock", trend: todayGrade(stats.todayMinutes, stats.todayCards))
            StatCard("Tasks", "\(stats.tasksOpen)", "\(stats.tasksDoneToday) done today", "checklist", trend: "Execute")
            StatCard("Journal", "\(stats.journalEntries)", "standups", "book.pages", trend: "Reflect")
        }
    }
}

func todayGrade(_ minutes: Int, _ cards: Int) -> String {
    if minutes >= 480 || cards >= 350 { return "👑 Blue" }
    if minutes >= 360 || cards >= 250 { return "Green" }
    if minutes >= 300 || cards >= 150 { return "Orange" }
    return "Red"
}

struct StatCard: View {
    let title: String
    let value: String
    let note: String
    let icon: String
    let trend: String

    init(_ title: String, _ value: String, _ note: String, _ icon: String, trend: String) {
        self.title = title
        self.value = value
        self.note = note
        self.icon = icon
        self.trend = trend
    }

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: icon).foregroundColor(.cyan)
                    Spacer()
                    Text(trend)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.green.opacity(0.95))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.green.opacity(0.12)))
                }

                Text(value)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text(title)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.84))

                Text(note)
                    .font(.system(size: 11, weight: .regular, design: .rounded))
                    .foregroundColor(.white.opacity(0.44))
            }
            .padding(16)
        }
        .frame(minHeight: 138)
    }
}

struct CourseCard: View {
    let name: String
    let term: String
    let files: Int
    let action: () -> Void

    init(_ name: String, term: String, files: Int, action: @escaping () -> Void) {
        self.name = name
        self.term = term
        self.files = files
        self.action = action
    }

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 13) {
                Text(term)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(.cyan)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(Color.cyan.opacity(0.12)))

                Text(name)
                    .font(.system(size: 21, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text("\(files) files")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.55))

                Button("Open", action: action)
                    .buttonStyle(.plain)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .frame(height: 34)
                    .glassButton()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .frame(minHeight: 175)
    }
}

struct RingScore: View {
    let minutes: Int
    let cards: Int

    var grade: String { todayGrade(minutes, cards) }

    var color: Color {
        if minutes >= 480 || cards >= 350 { return .blue }
        if minutes >= 360 || cards >= 250 { return .green }
        if minutes >= 300 || cards >= 150 { return .orange }
        return .red
    }

    var body: some View {
        HStack(spacing: 18) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.08), lineWidth: 14)
                Circle()
                    .trim(from: 0, to: min(CGFloat(minutes) / 480, 1))
                    .stroke(color.opacity(0.85), style: StrokeStyle(lineWidth: 14, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                Text(grade)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            }
            .frame(width: 116, height: 116)

            VStack(alignment: .leading, spacing: 8) {
                Text("\(minutes) minutes")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text("\(cards) 🃜🃚🃖🃁🂭🂺")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.70))

                Text("Useful day score: \(grade)")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.48))
            }

            Spacer()
        }
    }
}

struct Heatmap: View {
    let logs: [StudyLog]

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 5), count: 14), spacing: 5) {
            ForEach(days(), id: \.self) { day in
                let m = minutes(day)
                let c = cards(day)
                RoundedRectangle(cornerRadius: 4)
                    .fill(color(minutes: m, cards: c))
                    .frame(height: 18)
                    .overlay(Text(m >= 480 || c >= 350 ? "👑" : "").font(.system(size: 8)))
                    .help("\(label(day)): \(m) min, \(c) cards")
            }
        }
    }

    func days() -> [Date] {
        let today = Calendar.current.startOfDay(for: Date())
        return (0..<56).compactMap { Calendar.current.date(byAdding: .day, value: -55 + $0, to: today) }
    }

    func minutes(_ date: Date) -> Int {
        logs.filter { Calendar.current.isDate($0.date, inSameDayAs: date) }.reduce(0) { $0 + $1.minutes }
    }

    func cards(_ date: Date) -> Int {
        logs.filter { Calendar.current.isDate($0.date, inSameDayAs: date) }.reduce(0) { $0 + $1.cards }
    }

    func color(minutes: Int, cards: Int) -> Color {
        if minutes >= 480 || cards >= 350 { return .blue.opacity(0.88) }
        if minutes >= 360 || cards >= 250 { return .green.opacity(0.78) }
        if minutes >= 300 || (cards >= 150 && cards <= 200) { return .orange.opacity(0.82) }
        if minutes > 0 || cards > 0 { return .red.opacity(0.80) }
        return Color.white.opacity(0.055)
    }

    func label(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }
}

struct ReportHero: View {
    let title: String
    let value: String
    let caption: String

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                Text(title)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.58))

                Text(value)
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text(caption)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.42))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .frame(minHeight: 150)
    }
}

struct PanelHeader: View {
    let title: String
    let subtitle: String

    init(_ title: String, _ subtitle: String) {
        self.title = title
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(.white)

            Text(subtitle)
                .font(.system(size: 11.5, weight: .medium, design: .rounded))
                .foregroundColor(.white.opacity(0.42))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ActionTile: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void
    @State private var hover = false

    init(_ title: String, _ subtitle: String, _ icon: String, _ action: @escaping () -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundColor(.cyan)

                Text(title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text(subtitle)
                    .font(.system(size: 10.5, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.43))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, minHeight: 86, alignment: .leading)
            .padding(13)
            .glassButton(hover)
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
    }
}

struct MiniLog: View {
    let title: String
    let amount: String
    let action: () -> Void

    init(_ title: String, _ amount: String, _ action: @escaping () -> Void) {
        self.title = title
        self.amount = amount
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                Spacer()
                Text(amount)
                    .foregroundColor(.green)
            }
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundColor(.white.opacity(0.86))
            .padding(.horizontal, 12)
            .frame(height: 40)
            .glassButton()
        }
        .buttonStyle(.plain)
    }
}

struct MiniButton: View {
    let title: String
    let action: () -> Void

    init(_ title: String, _ action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(title, action: action)
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .frame(height: 36)
            .glassButton()
    }
}

struct SideButton: View {
    let title: String
    let icon: String
    let active: Bool
    let action: () -> Void

    init(_ title: String, _ icon: String, _ active: Bool, _ action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.active = active
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .frame(width: 20)
                    .foregroundColor(active ? .cyan : .white.opacity(0.68))

                Text(title)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(active ? .white : .white.opacity(0.72))

                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(RoundedRectangle(cornerRadius: 13).fill(active ? Color.cyan.opacity(0.15) : Color.clear))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(active ? Color.cyan.opacity(0.22) : Color.clear))
        }
        .buttonStyle(.plain)
    }
}

struct OuterBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.010, green: 0.012, blue: 0.022),
                    Color(red: 0.025, green: 0.030, blue: 0.060),
                    Color(red: 0.020, green: 0.045, blue: 0.080)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Orb(color: .cyan, size: 420, x: -470, y: -330, opacity: 0.22)
            Orb(color: .purple, size: 560, x: 500, y: 300, opacity: 0.15)
            Orb(color: .blue, size: 340, x: 10, y: 390, opacity: 0.11)
        }
    }
}

struct Orb: View {
    let color: Color
    let size: CGFloat
    let x: CGFloat
    let y: CGFloat
    let opacity: Double

    var body: some View {
        Circle()
            .fill(RadialGradient(colors: [color.opacity(opacity), color.opacity(0.035), .clear], center: .center, startRadius: 0, endRadius: size / 2))
            .frame(width: size, height: size)
            .blur(radius: 36)
            .offset(x: x, y: y)
    }
}

struct GlassShell<Content: View>: View {
    let content: Content
    @State private var sweep = false

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(.ultraThinMaterial)
                .background(
                    RoundedRectangle(cornerRadius: 30)
                        .fill(LinearGradient(colors: [Color.white.opacity(0.105), Color.white.opacity(0.045), Color.white.opacity(0.020)], startPoint: .topLeading, endPoint: .bottomTrailing))
                )
                .overlay(RoundedRectangle(cornerRadius: 30).stroke(Color.white.opacity(0.16), lineWidth: 1))
                .shadow(color: .black.opacity(0.56), radius: 46, x: 0, y: 32)
                .overlay(shellLuster.clipShape(RoundedRectangle(cornerRadius: 30)))

            content
        }
        .clipShape(RoundedRectangle(cornerRadius: 30))
        .onAppear { sweep = true }
    }

    var shellLuster: some View {
        GeometryReader { geo in
            Rectangle()
                .fill(LinearGradient(colors: [.clear, Color.white.opacity(0.11), Color.cyan.opacity(0.055), .clear], startPoint: .top, endPoint: .bottom))
                .frame(width: geo.size.width * 0.14, height: geo.size.height * 2.2)
                .rotationEffect(.degrees(17))
                .offset(x: sweep ? geo.size.width * 1.2 : -geo.size.width * 0.4, y: -geo.size.height * 0.5)
                .animation(.easeInOut(duration: 7.8).repeatForever(autoreverses: false), value: sweep)
        }
        .allowsHitTesting(false)
    }
}

struct GlassCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white.opacity(0.045))
                    .background(.thinMaterial)
            )
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.085), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

extension View {
    func glassButton(_ hover: Bool = false, radius: CGFloat = 14) -> some View {
        self
            .background(
                RoundedRectangle(cornerRadius: radius)
                    .fill(LinearGradient(colors: [Color.white.opacity(hover ? 0.135 : 0.060), Color.white.opacity(hover ? 0.055 : 0.026)], startPoint: .topLeading, endPoint: .bottomTrailing))
            )
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(Color.white.opacity(hover ? 0.18 : 0.075), lineWidth: 1))
            .shadow(color: Color.cyan.opacity(hover ? 0.13 : 0.02), radius: hover ? 14 : 4)
            .scaleEffect(hover ? 1.012 : 1.0)
            .animation(.easeOut(duration: 0.13), value: hover)
    }

    func standupField() -> some View {
        self
            .textFieldStyle(.plain)
            .font(.system(size: 13, weight: .medium, design: .rounded))
            .foregroundColor(.white)
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.06)))
    }
}

extension DateFormatter {
    static let shortDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static var fileSafe: DateFormatter {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd HH-mm-ss"
        return f
    }
}

// MARK: Helpers


func extractAnkiPasses(_ notes: String) -> Int {
    let parts = notes.components(separatedBy: "|")
    for part in parts {
        let trimmed = part.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.lowercased().hasPrefix("anki=") {
            let value = trimmed.replacingOccurrences(of: "anki=", with: "", options: .caseInsensitive)
            return Int(value.trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
        }
    }
    return 0
}

func strippingAnkiToken(_ notes: String) -> String {
    notes.components(separatedBy: "|")
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.lowercased().hasPrefix("anki=") }
        .joined(separator: " | ")
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

func writeAnkiPasses(_ notes: String, _ count: Int) -> String {
    let base = strippingAnkiToken(notes)
    if count <= 0 { return base }
    if base.isEmpty { return "anki=\(count)" }
    return "\(base) | anki=\(count)"
}

func preservingAnki(_ notes: String, replacingMainNoteWith main: String) -> String {
    let anki = extractAnkiPasses(notes)
    return writeAnkiPasses(main, anki)
}


func append(_ line: String, to path: String) {
    if let data = line.data(using: .utf8), let h = FileHandle(forWritingAtPath: path) {
        h.seekToEndOfFile()
        h.write(data)
        try? h.close()
    }
}

func clean(_ text: String) -> String {
    text
        .replacingOccurrences(of: ",", with: " ")
        .replacingOccurrences(of: "\n", with: " ")
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

func shell(_ command: String) -> String {
    let p = Process()
    let pipe = Pipe()
    p.executableURL = URL(fileURLWithPath: "/bin/zsh")
    p.arguments = ["-lc", command]
    p.standardOutput = pipe
    p.standardError = pipe

    do {
        try p.run()
        p.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    } catch {
        return "Error: \(error.localizedDescription)"
    }
}

func parseStats(_ text: String) -> Stats {
    var d: [String: Int] = [:]
    for line in text.split(separator: "\n") {
        let p = line.split(separator: "=", maxSplits: 1)
        if p.count == 2 { d[String(p[0])] = Int(p[1]) ?? 0 }
    }

    return Stats(
        inbox: d["inbox"] ?? 0,
        downloads: d["downloads"] ?? 0,
        needsReview: d["needs_review"] ?? 0,
        ankiNeeded: d["anki_needed"] ?? 0,
        summaryNeeded: d["summary_needed"] ?? 0,
        weakArea: d["weak_area"] ?? 0,
        todayMinutes: d["today_minutes"] ?? 0,
        todayCards: d["today_cards"] ?? 0,
        manualMinutesToday: d["manual_minutes_today"] ?? 0,
        journalEntries: d["journal_entries"] ?? 0,
        tasksOpen: d["tasks_open"] ?? 0,
        tasksDoneToday: d["tasks_done_today"] ?? 0,
        bpm500: d["bpm500"] ?? 0,
        bpm501: d["bpm501"] ?? 0,
        ppm500: d["ppm500"] ?? 0,
        ppm501: d["ppm501"] ?? 0,
        ppm502: d["ppm502"] ?? 0
    )
}

func loadLogs(_ path: String) -> [StudyLog] {
    guard let text = try? String(contentsOfFile: path) else { return [] }
    let f = ISO8601DateFormatter()

    return text.split(separator: "\n").dropFirst().compactMap {
        let p = $0.split(separator: ",", omittingEmptySubsequences: false).map(String.init)
        guard p.count >= 5, let date = f.date(from: p[0]) else { return nil }
        return StudyLog(date: date, type: p[1], minutes: Int(p[2]) ?? 0, cards: Int(p[3]) ?? 0, note: p[4])
    }
}

func loadJournal(_ path: String) -> [JournalEntry] {
    guard let text = try? String(contentsOfFile: path) else { return [] }

    return text.split(separator: "\n").dropFirst().compactMap {
        let p = $0.split(separator: ",", omittingEmptySubsequences: false).map(String.init)
        guard p.count >= 6 else { return nil }
        return JournalEntry(date: p[0], today: p[1], tomorrow: p[2], blockers: p[3], energy: p[4], rating: p[5])
    }
}


func loadPrompts(base: String) -> [PromptItem] {
    let path = "\(base)/09 Admin/App Data/prompt_library.csv"
    guard let text = try? String(contentsOfFile: path) else { return [] }

    return text.split(separator: "\n").dropFirst().compactMap { row in
        let parts = parseCSVLine(String(row))
        guard parts.count >= 7 else { return nil }

        return PromptItem(
            id: parts[0],
            title: parts[1],
            category: parts[2],
            tags: parts[3],
            created: parts[4],
            updated: parts[5],
            path: parts[6]
        )
    }
}

func parseCSVLine(_ line: String) -> [String] {
    var result: [String] = []
    var current = ""
    var insideQuotes = false

    for char in line {
        if char == "\"" {
            insideQuotes.toggle()
        } else if char == "," && !insideQuotes {
            result.append(current)
            current = ""
        } else {
            current.append(char)
        }
    }

    result.append(current)
    return result
}


func loadCourseTracker(_ path: String) -> [CourseTrackerItem] {
    guard let text = try? String(contentsOfFile: path) else { return [] }

    return text
        .split(separator: "\n")
        .dropFirst()
        .compactMap { row in
            let p = parseCSVLine(String(row))
            guard p.count >= 9 else { return nil }

            return CourseTrackerItem(
                id: p[0],
                week: p[1],
                type: p[2],
                label: p[3],
                status: p[4],
                quality: Int(p[5]) ?? 0,
                color: p[6],
                notes: p[7],
                updated: p[8]
            )
        }
}



func updateTrackerItem(base: String, id: String, qualityDelta: Int, newColor: String?) {
    let path = "\(base)/09 Admin/App Data/Course Trackers/nb3_tracker.csv"
    guard let raw = try? String(contentsOfFile: path) else { return }

    var output: [String] = []
    let now = DateFormatter.shortDate.string(from: Date())

    for line in raw.components(separatedBy: .newlines) {
        if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            continue
        }

        if line.hasPrefix("id,") {
            output.append(line)
            continue
        }

        var parts = parseCSVLine(line)
        while parts.count < 9 { parts.append("") }

        if parts[0] == id {
            var q = Int(parts[5]) ?? 0

            if qualityDelta == -999 {
                q = 0
            } else {
                q = max(0, min(5, q + qualityDelta))
            }

            parts[5] = "\(q)"

            if let c = newColor {
                parts[6] = c
                switch c {
                case "red": parts[4] = "needs_work"
                case "orange": parts[4] = "shaky"
                case "green": parts[4] = "completed"
                case "blue": parts[4] = "mastered"
                default: parts[4] = "not_started"
                }
            } else {
                if q == 0 {
                    parts[6] = "gray"
                    parts[4] = "not_started"
                } else if q == 1 {
                    parts[6] = "orange"
                    parts[4] = "pass_1"
                } else if q == 2 || q == 3 {
                    parts[6] = "green"
                    parts[4] = "completed"
                } else {
                    parts[6] = "blue"
                    parts[4] = "mastered"
                }
            }

            parts[8] = now
            output.append(parts.map(csvEscape).joined(separator: ","))
        } else {
            output.append(line)
        }
    }

    try? output.joined(separator: "\n").appending("\n").write(toFile: path, atomically: true, encoding: .utf8)
}

func addTrackerPracticeItem(base: String, type: String, title: String) {
    let path = "\(base)/09 Admin/App Data/Course Trackers/nb3_tracker.csv"
    let safeType = type.replacingOccurrences(of: ",", with: " ")
    let safeTitle = title.replacingOccurrences(of: ",", with: " ")
    let id = "\(safeType.uppercased().replacingOccurrences(of: " ", with: ""))-\(Int(Date().timeIntervalSince1970))"
    let now = DateFormatter.shortDate.string(from: Date())
    let line = "\(id),Week Custom,\(safeType),\(safeTitle),not_started,0,gray,Manual add,\(now)"
    append(line, to: path)
}

func csvEscape(_ value: String) -> String {
    if value.contains(",") || value.contains("\"") || value.contains("\n") {
        return "\"" + value.replacingOccurrences(of: "\"", with: "\"\"") + "\""
    }
    return value
}


func loadTasks(_ path: String) -> [TaskItem] {
    guard let text = try? String(contentsOfFile: path) else { return [] }

    return text.split(separator: "\n").dropFirst().compactMap {
        let p = $0.split(separator: ",", omittingEmptySubsequences: false).map(String.init)
        guard p.count >= 6 else { return nil }
        return TaskItem(id: p[0], created: p[1], due: p[2], title: p[3], status: p[4], completed: p[5])
    }
}
