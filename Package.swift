// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Noctyrium",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "Noctyrium",
            path: "Sources/Noctyrium"
        )
    ]
)
